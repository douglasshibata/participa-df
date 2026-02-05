import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManifestationStatusComponent } from './manifestation-status.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ManifestationService } from '../../services/manifestation.service';
import { of } from 'rxjs';

describe('ManifestationStatusComponent', () => {
  let component: ManifestationStatusComponent;
  let fixture: ComponentFixture<ManifestationStatusComponent>;
  let service: ManifestationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ManifestationStatusComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManifestationStatusComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ManifestationService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should search for protocol', () => {
    const mockData = {
      protocol: 'OUV-123',
      status: 'processed',
      original_text: 'test',
      ai_content: 'ai',
      final_content: 'test ai',
      source_type: 'text',
      confidence_score: 1.0,
      anonymous: true,
      iza_tracking_id: 'iza-1'
    };
    spyOn(service, 'getManifestation').and.returnValue(of(mockData));

    component.protocolInput.set('OUV-123');
    component.search();

    expect(service.getManifestation).toHaveBeenCalledWith('OUV-123');
    expect(component.data()).toEqual(mockData);
  });
});
