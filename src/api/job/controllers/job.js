"use strict";

const { getCustomItem } = require("../../../utils/item");

/**
 * job controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::job.job", ({ strapi }) => ({
  async find(ctx) {
    ctx.query = {
      ...ctx.query,
      populate: {
        leftHand: {
          populate: ["tier", "type"],
        },
        rightHand: {
          populate: ["tier", "type"],
        },
        armor: {
          populate: ["tier", "type"],
        },
        accessory1: {
          populate: ["tier", "type"],
        },
        accessory2: {
          populate: ["tier", "type"],
        },
      },
    };

    const { data } = await super.find(ctx);

    const jobs = [];

    for (let job of data) {
      job = {
        id: job.id,
        ...job.attributes,
      };

      job.leftHand = getCustomItem(job.leftHand.data);
      job.rightHand = getCustomItem(job.rightHand.data);
      job.armor = getCustomItem(job.armor.data);
      job.accessory1 = getCustomItem(job.accessory1.data);
      job.accessory2 = getCustomItem(job.accessory2.data);

      jobs.push(job);
    }

    return { jobs };
  },
}));
