import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ManifestationService } from './manifestation.service';

describe('ManifestationService', () => {
  let service: ManifestationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ManifestationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
