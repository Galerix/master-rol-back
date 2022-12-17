"use strict";

/**
 * character controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

function calculateStat(statName, characterStat, raceStat, characerJob, items) {
  const initialStat =
    characterStat +
    raceStat +
    (characerJob.bonusType == statName ? characerJob.bonusStat : 0);

  var finalStat = initialStat;

  items.map((item) => {
    if (item.bonus && item.bonusType == statName) {
      finalStat += item.bonus;
    }
    if (item.penalty && item.penaltyType == statName) {
      finalStat -= item.penalty;
    }
  });

  return { initial: initialStat, final: finalStat > 0 ? finalStat : 1 };
}

async function findItem(itemId) {
  if (!itemId) {
    return {};
  }

  return await strapi.service("api::item.item").findOne(itemId, {
    fields: [
      "id",
      "name",
      "skill1",
      "skill2",
      "skill3",
      "bonus",
      "bonusType",
      "penalty",
      "penaltyType",
    ],
    populate: {
      tier: { fields: ["id", "name"] },
      type: { fields: ["id", "name", "scope", "statScale"] },
    },
  });
}

module.exports = createCoreController(
  "api::character.character",
  ({ strapi }) => ({
    // api/characters
    async find(ctx) {
      ctx.query = { ...ctx.query, populate: "*" };

      const { data, meta } = await super.find(ctx);

      const characters = [];

      for (const character of data) {
        let characterRace = character.attributes.race.data ? character.attributes.race.data.attributes: {};
        let characerJob = character.attributes.job.data ? character.attributes.job.data.attributes : {};
        let characterInventory = character.attributes.inventory.data;

        let customEquipment = [];
        let customInventory = [];

        let characterLeftHand = character.attributes.leftHand.data
          ? await findItem(character.attributes.leftHand.data.id)
          : {};

        let characterRightHand = character.attributes.rightHand.data
          ? await findItem(character.attributes.rightHand.data.id)
          : {};

        let characterArmor = character.attributes.armor.data
          ? await findItem(character.attributes.armor.data.id)
          : {};

        let characterAccessory1 = character.attributes.accessory1.data
          ? await findItem(character.attributes.accessory1.data.id)
          : {};

        let characterAccessory2 = character.attributes.accessory2.data
          ? await findItem(character.attributes.accessory2.data.id)
          : {};

        customEquipment.push(
          characterLeftHand,
          characterRightHand,
          characterArmor,
          characterAccessory1,
          characterAccessory2
        );

        for (const item of characterInventory) {
          const customItem = await findItem(item.id);
          customInventory.push(customItem);
        }

        let ratioHPE = characterRace.ratioHPE;

        let characterStats = {
          strength: calculateStat(
            "strength",
            character.attributes.strength,
            characterRace.strengthBase,
            characerJob,
            customEquipment
          ),
          perception: calculateStat(
            "perception",
            character.attributes.perception,
            characterRace.perceptionBase,
            characerJob,
            customEquipment
          ),
          endurance: calculateStat(
            "endurance",
            character.attributes.endurance,
            characterRace.enduranceBase,
            characerJob,
            customEquipment
          ),
          charisma: calculateStat(
            "charisma",
            character.attributes.charisma,
            characterRace.charismaBase,
            characerJob,
            customEquipment
          ),
          intelligence: calculateStat(
            "intelligence",
            character.attributes.intelligence,
            characterRace.intelligenceBase,
            characerJob,
            customEquipment
          ),
          agility: calculateStat(
            "agility",
            character.attributes.agility,
            characterRace.agilityBase,
            characerJob,
            customEquipment
          ),
          luck: calculateStat(
            "luck",
            character.attributes.luck,
            characterRace.luckBase,
            characerJob,
            customEquipment
          ),
        };

        let customCharacter = {
          id: character.id,
          slug: character.attributes.slug,
          name: character.attributes.name,
          strength: characterStats.strength,
          perception: characterStats.perception,
          endurance: characterStats.endurance,
          charisma: characterStats.charisma,
          intelligence: characterStats.intelligence,
          agility: characterStats.agility,
          luck: characterStats.luck,
          maxHealth: ratioHPE * characterStats.endurance.initial,
          health: character.attributes.health,
          maxExperience: character.attributes.level * 100,
          experience: character.attributes.experience,
          level: character.attributes.level,
          race: {
            name: characterRace.name,
            skill: characterRace.skill,
          },
          job: {
            name: characerJob.name,
            skill: characerJob.skill,
          },
          equipment: {
            leftHand: characterLeftHand,
            rightHand: characterRightHand,
            armor: characterArmor,
            accessory1: characterAccessory1,
            accessory2: characterAccessory2,
          },
          inventory: customInventory,
          image: character.attributes.image,
        };

        characters.push(customCharacter);
      }

      return { characters, meta };
    },
  })
);
