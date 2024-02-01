/* Importamos los módulos necesarios para realizar pruebas en Angular */
import { ComponentFixture, TestBed } from '@angular/core/testing';

/* Importamos el componente MenuPage que será probado */
import { MenuPage } from './menu.page';

/* Definimos la suite de pruebas para el componente MenuPage */
describe('MenuPage', () => {
  let component: MenuPage;
  let fixture: ComponentFixture<MenuPage>;

  /* Configuramos el entorno de pruebas antes de cada prueba */
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MenuPage], // Declaramos el componente a probar
    })
    .compileComponents(); // Compilamos los componentes para su uso en las pruebas

    /* Creamos una instancia del componente y su fixture para realizar las pruebas */
    fixture = TestBed.createComponent(MenuPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Detectamos los cambios en el componente antes de las pruebas
  }));

  /* Realizamos una prueba para verificar que el componente se crea correctamente */
  it('should create', () => {
    expect(component).toBeTruthy(); // Verificamos que el componente exista
  });
});
