import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManifestationFormComponent } from './manifestation-form.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LiveAnnouncer } from '@angular/cdk/a11y';

describe('ManifestationFormComponent', () => {
  let component: ManifestationFormComponent;
  let fixture: ComponentFixture<ManifestationFormComponent>;
  let liveAnnouncerSpy: jasmine.SpyObj<LiveAnnouncer>;

  beforeEach(async () => {
    liveAnnouncerSpy = jasmine.createSpyObj('LiveAnnouncer', ['announce']);

    await TestBed.configureTestingModule({
      imports: [
        ManifestationFormComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: LiveAnnouncer, useValue: liveAnnouncerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManifestationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should announce file selection', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const event = { target: { files: [file] } };
    component.onFileSelected(event);
    expect(component.selectedFile()).toBe(file);
    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Arquivo test.png selecionado');
  });

  it('should show error if submitting empty form', async () => {
    await component.submit();
    expect(component.error()).toBe('Por favor, forneça um relato em texto ou um arquivo de mídia.');
    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Erro: Por favor, forneça um relato em texto ou um arquivo de mídia.');
  });
});
