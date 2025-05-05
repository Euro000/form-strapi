import { factories } from '@strapi/strapi';
import type { Context } from 'koa';

export default factories.createCoreController(
  'api::form.form',
  ({ strapi }) => ({
    /**
     * Override POST /api/forms
     * - Rejects duplicates (unless last was “reject”)
     * - Injects ctx.state.user.id
     * - Populates user relation in response
     */
    async create(ctx: Context) {
      const user = ctx.state.user as { id: number } | undefined;
      if (!user) {
        return ctx.unauthorized('You must be logged in to submit a form');
      }

      // Prevent duplicate unless last submission was rejected
      // @ts-ignore
      const existingCount = await strapi.entityService.count(
        'api::form.form',
        {
          // @ts-ignore
          filters: {
            user: { id: user.id },
            userStatus: { $not: 'reject' },
          },
        }
      );
      if (existingCount > 0) {
        ctx.status = 302;
        ctx.redirect('/status');
        return;
      }

      // Inject the user ID
      ctx.request.body.data = {
        ...ctx.request.body.data,
        user: user.id,
      };

      // Create and populate user
      // @ts-ignore
      const entry = await strapi.entityService.create('api::form.form', {
        data: ctx.request.body.data,
        // @ts-ignore
        populate: ['user'],
      });

      return this.transformResponse(entry);
    },

    /**
     * GET /api/forms/me-has
     * Returns { hasForm: boolean } for the authenticated user.
     */
    async hasMe(ctx: Context) {
      const user = ctx.state.user as { id: number } | undefined;
      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const count = await strapi.entityService.count('api::form.form', {
        filters: { user: { id: user.id } },
      });

      ctx.body = { hasForm: count > 0 };
    },
  })
);