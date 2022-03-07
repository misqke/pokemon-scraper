const puppeteer = require("puppeteer");
const fs = require("fs");

const firstPokemon = 1; // num of first pokemon you want
const lastPokemon = 898; // num of last pokemon you want

const scrapePokemon = async () => {
  // launch browser and open new page
  const browser = await puppeteer.launch({});
  const page = await browser.newPage();
  try {
    const pokemonList = [];

    for (let i = firstPokemon - 1; i < lastPokemon; i++) {
      await page.goto(`https://pokemon.com/us/pokedex/${i + 1}`);
      await page.waitForSelector(".pokemon-stats-info.active");
      // evaluate page for pokemon data
      const newPokemon = await page.evaluate(() => {
        // declare new pokemon object
        const pokemon = {};

        // get title containing name and number
        const title = document.querySelector(
          ".pokedex-pokemon-pagination-title > div"
        ).innerText;
        const splitTitle = title.split(" ");
        pokemon.number = Number(splitTitle.pop().slice(1));
        pokemon.name = splitTitle.join(" ");

        // get img url
        pokemon.img = {};
        pokemon.img.large = document
          .querySelector("img.active")
          .getAttribute("src");
        pokemon.img.small = pokemon.img.large.replace("full", "detail");

        // get stat list
        const statsList = document.querySelectorAll(
          ".pokemon-stats-info.active > ul > li"
        );
        // add each stat and value to pokemon stats
        pokemon.stats = [];
        for (let i = 0; i < statsList.length; i++) {
          const newStat = {};
          newStat.name = statsList[i].querySelector("span").innerText;
          newStat.value = Number(
            statsList[i].querySelector("ul > li").getAttribute("data-value")
          );
          pokemon.stats.push(newStat);
        }

        // get descriptions
        pokemon.desc1 = document
          .querySelector(".version-x")
          .innerText.trim("/n")
          .trim();
        pokemon.desc2 = document
          .querySelector(".version-y")
          .innerText.trim("/n")
          .trim();

        // get info
        pokemon.info = [];
        const infoBox = document.querySelector(
          ".pokemon-ability-info.color-bg.color-lightblue.match.active"
        );
        const cols = infoBox.querySelectorAll("div > ul > li");
        for (let i = 0; i < cols.length; i++) {
          const newInfo = {};
          const colsInfo = cols[i].querySelectorAll("span");
          newInfo.name = colsInfo[0].innerText;
          newInfo.value =
            i === 0
              ? colsInfo[1].innerText.slice(0, colsInfo[1].innerText.length - 1)
              : colsInfo[1].innerText;
          // handle genders
          if (i === 2 && newInfo.value === "") {
            const genders = cols[i].querySelectorAll("i");
            if (genders.length === 2) {
              newInfo.value = ["Male", "Female"];
            } else {
              let gender = genders[0].classList[1].split("_")[1];
              const firstLetter = gender.slice(0, 1);
              newInfo.value = firstLetter.toUpperCase() + gender.slice(1);
            }
          }
          // get abilitiese with descs
          if (i === 4) {
            const abilities = cols[i].querySelector("ul");
            if (abilities) {
              const values = abilities.querySelectorAll(".attribute-value");
              const descs = document.querySelectorAll(
                ".pokemon-ability-info-detail.match"
              );
              newInfo.value = [];
              for (let i = 0; i < values.length; i++) {
                const ability = {};
                ability.name = values[i].innerText;
                ability.desc = descs[i].querySelector("p").innerText;
                newInfo.value.push(ability);
              }
            }
          }
          pokemon.info.push(newInfo);
        }

        // get type
        const typeList = document.querySelectorAll(
          ".pokedex-pokemon-attributes.active > .dtm-type > ul > li"
        );
        pokemon.type = [];
        for (let i = 0; i < typeList.length; i++) {
          const type = typeList[i].classList[0].split("-")[2];
          const firstLetter = type.slice(0, 1);
          pokemon.type.push(firstLetter.toUpperCase() + type.slice(1));
        }

        // get weaknesses
        const weaknessList = document.querySelectorAll(
          ".pokedex-pokemon-attributes.active > .dtm-weaknesses > ul > li"
        );
        pokemon.weaknesses = [];
        for (let i = 0; i < weaknessList.length; i++) {
          const weakness = weaknessList[i].classList[0].split("-")[2];
          const firstLetter = weakness.slice(0, 1);
          pokemon.weaknesses.push(
            firstLetter.toUpperCase() + weakness.slice(1)
          );
        }

        // get evolutions
        const evolutions = document.querySelectorAll(".evolution-profile > li");
        pokemon.evolutions = [];
        for (let i = 0; i < evolutions.length; i++) {
          const evolution = {};
          evolution.num = Number(
            evolutions[i].querySelector(".pokemon-number").innerText.slice(1)
          );
          evolution.name = evolutions[i]
            .querySelector("a > h3")
            .innerText.split(" ")[0];
          evolution.img = evolutions[i]
            .querySelector("a > img")
            .getAttribute("src");
          evolution.types = [];
          const types = evolutions[i].querySelectorAll("a > ul > li");
          for (let i = 0; i < types.length; i++) {
            evolution.types.push(types[i].innerText);
          }
          pokemon.evolutions.push(evolution);
        }

        // return the pokemon
        return pokemon;
      });
      if (newPokemon) {
        pokemonList.push(newPokemon);
      }
      console.log(newPokemon.number);
    }

    // create json file
    fs.writeFileSync("pokemon.json", JSON.stringify(pokemonList));
    // close browser
    await browser.close();
  } catch (error) {
    console.log(error);
    // close browser
    await browser.close();
  }
};

scrapePokemon();
