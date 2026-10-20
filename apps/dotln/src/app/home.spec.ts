import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';
import { Home } from './home';

describe('Home', () => {
  it('renders the home heading inside the main landmark', async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [...provideDotlnI18nTestKit().providers],
    }).compileComponents();
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('main h1')?.textContent).toBe('DotLn');
    expect(TestBed.inject(Title).getTitle()).toBe('DotLn');
  });
});
