"use strict";

const { getCustomItem } = require("../../../utils/item");

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
    if (item) {
      if (item.bonus && item.bonusType == statName) {
        finalStat += item.bonus;
      }
      if (item.penalty && item.penaltyType == statName) {
        finalStat -= item.penalty;
      }
    }
  });

  return { initial: initialStat, final: finalStat > 0 ? finalStat : 1 };
}

module.exports = createCoreController(
  "api::character.character",
  ({ strapi }) => ({
    // api/characters
    async find(ctx) {
      const itemFields = [
        "id",
        "name",
        "skill1",
        "skill2",
        "skill3",
        "bonus",
        "bonusType",
        "penalty",
        "penaltyType",
      ];

      const tierFields = ["id", "name"];

      const typeFields = ["id", "name", "scope", "statScale"];

      ctx.query = {
        ...ctx.query,
        populate: {
          race: {
            fields: [
              "id",
              "name",
              "skill",
              "strengthBase",
              "perceptionBase",
              "enduranceBase",
              "charismaBase",
              "intelligenceBase",
              "agilityBase",
              "luckBase",
              "ratioHPE",
            ],
          },
          job: {
            fields: ["id", "name", "skill", "bonusStat", "bonusType"],
          },
          inventory: {
            fields: itemFields,
            populate: {
              tier: { fields: tierFields },
              type: { fields: typeFields },
            },
          },
          leftHand: {
            fields: itemFields,
            populate: {
              tier: { fields: tierFields },
              type: { fields: typeFields },
            },
          },
          rightHand: {
            populate: {
              tier: { fields: tierFields },
              type: { fields: typeFields },
            },
          },
          armor: {
            populate: {
              tier: { fields: tierFields },
              type: { fields: typeFields },
            },
          },
          accessory1: {
            populate: {
              tier: { fields: tierFields },
              type: { fields: typeFields },
            },
          },
          accessory2: {
            populate: {
              tier: { fields: tierFields },
              type: { fields: typeFields },
            },
          },
          image: {
            fields: ["*"],
          },
        },
      };

      const { data } = await super.find(ctx);

      const characters = [];

      for (let character of data) {
        character = { id: character.id, ...character.attributes };

        const race = {
          id: character.race.data.id,
          ...character.race.data.attributes,
        };

        character.race = race;

        const job = {
          id: character.job.data.id,
          ...character.job.data.attributes,
        };

        character.job = job;

        const leftHand = getCustomItem({ ...character.leftHand.data });
        const rightHand = getCustomItem({ ...character.rightHand.data });
        const armor = getCustomItem({ ...character.armor.data });
        const accessory1 = getCustomItem({ ...character.accessory1.data });
        const accessory2 = getCustomItem({ ...character.accessory2.data });

        const equipment = {
          leftHand,
          rightHand,
          armor,
          accessory1,
          accessory2,
        };

        character.equipment = equipment;

        delete character.leftHand;
        delete character.rightHand;
        delete character.armor;
        delete character.accessory1;
        delete character.accessory2;

        const inventory = character.inventory.data;

        for (let i = 0; i < inventory.length; i++) {
          inventory[i] = getCustomItem(inventory[i]);
        }

        character.inventory = inventory;

        character.strength = calculateStat(
          "strength",
          character.strength,
          race.strengthBase,
          job,
          Object.values(equipment)
        );
        character.perception = calculateStat(
          "perception",
          character.perception,
          race.perceptionBase,
          job,
          Object.values(equipment)
        );
        character.endurance = calculateStat(
          "endurance",
          character.endurance,
          race.enduranceBase,
          job,
          Object.values(equipment)
        );
        character.charisma = calculateStat(
          "charisma",
          character.charisma,
          race.charismaBase,
          job,
          Object.values(equipment)
        );
        character.intelligence = calculateStat(
          "intelligence",
          character.intelligence,
          race.intelligenceBase,
          job,
          Object.values(equipment)
        );
        character.agility = calculateStat(
          "agility",
          character.agility,
          race.agilityBase,
          job,
          Object.values(equipment)
        );
        character.luck = calculateStat(
          "luck",
          character.luck,
          race.luckBase,
          job,
          Object.values(equipment)
        );

        character.maxHealth = race.ratioHPE * character.endurance.initial;

        character.maxExperience = character.level * 100;

        delete character.race.strengthBase;
        delete character.race.perceptionBase;
        delete character.race.enduranceBase;
        delete character.race.charismaBase;
        delete character.race.intelligenceBase;
        delete character.race.agilityBase;
        delete character.race.luckBase;
        delete character.race.ratioHPE;
        delete character.job.bonusStat;
        delete character.job.bonusType;

        characters.push(character);
      }

      return { characters };
    },
  })
);
