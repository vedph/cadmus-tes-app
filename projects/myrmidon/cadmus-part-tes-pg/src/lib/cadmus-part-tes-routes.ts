import { Routes } from '@angular/router';

// cadmus
import { pendingChangesGuard } from '@myrmidon/cadmus-core';
// site resources
import {
  SITE_RESOURCES_PART_TYPEID,
  SiteResourcesPartFeature,
} from '@myrmidon/cadmus-part-tes-site-resources';

export const CADMUS_PART_TES_PG_ROUTES: Routes = [
  {
    path: `${SITE_RESOURCES_PART_TYPEID}/:pid`,
    pathMatch: 'full',
    component: SiteResourcesPartFeature,
    canDeactivate: [pendingChangesGuard],
  },
];
