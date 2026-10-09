import { pendingChangesGuard } from '@myrmidon/cadmus-core';
import {
  SITE_RESOURCES_PART_TYPEID,
  SiteResourcesPartFeature,
} from '@myrmidon/cadmus-part-tes-site-resources';

import { CADMUS_PART_TES_PG_ROUTES } from './cadmus-part-tes-routes';

describe('CADMUS_PART_TES_PG_ROUTES', () => {
  it('has a single route', () => {
    expect(CADMUS_PART_TES_PG_ROUTES.length).toBe(1);
  });

  it('maps the site resources part type to its feature editor', () => {
    const route = CADMUS_PART_TES_PG_ROUTES[0];
    expect(route.path).toBe(`${SITE_RESOURCES_PART_TYPEID}/:pid`);
    expect(route.pathMatch).toBe('full');
    expect(route.component).toBe(SiteResourcesPartFeature);
  });

  it('guards the editor against losing pending changes', () => {
    expect(CADMUS_PART_TES_PG_ROUTES[0].canDeactivate).toEqual([pendingChangesGuard]);
  });

  it('builds a path whose prefix is the part type ID, as expected by the feature', () => {
    // EditPartFeatureBase extracts the part type ID from the route path
    // as the substring before the first slash
    const path = CADMUS_PART_TES_PG_ROUTES[0].path!;
    expect(path.substring(0, path.indexOf('/'))).toBe(SITE_RESOURCES_PART_TYPEID);
  });
});
