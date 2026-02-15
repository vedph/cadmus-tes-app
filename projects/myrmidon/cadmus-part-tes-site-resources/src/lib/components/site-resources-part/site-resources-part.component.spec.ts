import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteResourcesPartComponent } from './site-resources-part.component';

describe('SiteResourcesPartComponent', () => {
  let component: SiteResourcesPartComponent;
  let fixture: ComponentFixture<SiteResourcesPartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteResourcesPartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteResourcesPartComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
