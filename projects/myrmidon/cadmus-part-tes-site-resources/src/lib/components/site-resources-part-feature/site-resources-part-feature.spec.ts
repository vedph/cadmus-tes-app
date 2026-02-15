import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteResourcesPartFeature } from './site-resources-part-feature';

describe('SiteResourcesPartFeature', () => {
  let component: SiteResourcesPartFeature;
  let fixture: ComponentFixture<SiteResourcesPartFeature>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteResourcesPartFeature]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteResourcesPartFeature);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
