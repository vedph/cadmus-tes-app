import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';

import { ItemService, ThesaurusService } from '@myrmidon/cadmus-api';
import { EditPartFeatureBase, PartEditorService } from '@myrmidon/cadmus-state';
import { CurrentItemBarComponent } from '@myrmidon/cadmus-ui-pg';

import { SiteResourcesPartComponent } from '../site-resources-part/site-resources-part.component';

@Component({
  selector: 'cadmus-site-resources-part-feature',
  imports: [CurrentItemBarComponent, SiteResourcesPartComponent],
  templateUrl: './site-resources-part-feature.html',
  styleUrl: './site-resources-part-feature.css',
})
export class SiteResourcesPartFeature extends EditPartFeatureBase implements OnInit {
  constructor(
    router: Router,
    route: ActivatedRoute,
    snackbar: MatSnackBar,
    itemService: ItemService,
    thesaurusService: ThesaurusService,
    editorService: PartEditorService,
  ) {
    super(router, route, snackbar, itemService, thesaurusService, editorService);
  }

  protected override getReqThesauriIds(): string[] {
    this.roleIdInThesauri = true;

    return [
      'site-resource-types',
      'site-resource-tags',
      'site-resource-features',
      'asserted-historical-date-tags',
      'doc-reference-types',
      'doc-reference-tags',
      'site-resource-count-ids',
      'site-resource-count-tags',
      'geo-location-tags',
      'assertion-tags',
    ];
  }
}
