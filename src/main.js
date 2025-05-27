import { PowerToysController } from './PowerToysController.js';

/**
 * Punt d'entrada principal de l'script Esfer@ PowerToys.
 * Inicialitza el controlador i activa l'observador per detectar canvis a la pàgina.
 */
(function () {
    'use strict';

    // Inicialitzem el controlador principal
    const controller = new PowerToysController();

    // Exposem a window si cal per debugging manual
    window.PowerToysController = controller;
})();
