import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteResourceEditor } from './site-resource-editor';

describe('SiteResourceEditor', () => {
  let component: SiteResourceEditor;
  let fixture: ComponentFixture<SiteResourceEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteResourceEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteResourceEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
