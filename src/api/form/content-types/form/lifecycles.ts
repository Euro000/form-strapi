import { randomInt } from "crypto";

export default {
  // ① On create, mark it “filled” (instead of “wait”)
  beforeCreate(event: any) {
    event.params.data.userStatus = "filled";
  },

  // ② After admin updates status → “success”, assign promo
  async afterUpdate(event: any) {
    if (event.params.data?.userStatus !== "success") return;

    const formId = event.result.id;

    // ts-ignore so we can populate the `user` relation
    // @ts-ignore
    const formWithUser = (await strapi.entityService.findOne(
      "api::form.form",
      formId,
      { populate: ["user"] }
    )) as any;

    const userRel = formWithUser.user;
    if (!userRel) {
      strapi.log.warn(`Form ${formId} has no user attached—skipping`);
      return;
    }

    const userId = typeof userRel === "object" ? userRel.id : userRel;
    const already = await strapi.entityService.count(
      "api::promotion.promotion",
      { filters: { user: userId } }
    );
    if (already > 0) {
      strapi.log.info(`User ${userId} already has a promo—skipping`);
      return;
    }

    const raw = await strapi.entityService.findMany(
      "api::promotion.promotion",
      {
        filters: { code_status: "unused" },
        fields: ["id", "promotion_code"],
      }
    );
    const unused = raw.map((p: any) => ({
      id: Number(p.id),
      promotion_code: p.promotion_code!,
    }));
    if (unused.length === 0) {
      strapi.log.warn("No unused promotion codes left!");
      return;
    }

    const chosen = unused[randomInt(unused.length)];
    await strapi.entityService.update(
      "api::promotion.promotion",
      chosen.id,
      { data: { code_status: "used", user: userId } }
    );

    strapi.log.info(
      `Assigned promo "${chosen.promotion_code}" (id:${chosen.id}) to user ${userId}`
    );
  },
};