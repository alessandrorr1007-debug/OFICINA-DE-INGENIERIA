(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else {
    root.STATIONS_REGISTRY = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    github: {
      id: 'github',
      nombre: 'GitHub',
      encargado: 'Hugo',
      rol: 'Bibliotecario del repositorio',
      tipo: 'repositorio',
      color: '#7c91b8',
      ready: true,
      fields: [
        {
          id: 'token',
          label: 'Token de GitHub (Fine-grained, solo lectura)',
          type: 'password',
          placeholder: 'github_pat_...',
          required: true,
          help: 'Token personal con permiso de solo lectura en el repositorio alessandrorr1007-debug/OFICINA-DE-INGENIERIA.'
        }
      ],
      fixed: {
        repo: 'alessandrorr1007-debug/OFICINA-DE-INGENIERIA'
      }
    },
    ai: {
      id: 'ai',
      nombre: 'IA',
      encargado: 'Iris',
      rol: 'Especialista en modelos de IA',
      tipo: 'modelos',
      color: '#7776a3',
      ready: true,
      fields: [
        {
          id: 'apiKey',
          label: 'API Key de Groq',
          type: 'password',
          placeholder: 'gsk_...',
          required: true,
          help: 'Clave de acceso a la API de Groq Console.'
        },
        {
          id: 'model',
          label: 'Modelo de IA (Groq)',
          type: 'select',
          options: [
            { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile (Recomendado producción)' },
            { value: 'llama-3.1-8b-instant', label: 'llama-3.1-8b-instant (Rápido y ligero)' }
          ],
          default: 'llama-3.3-70b-versatile',
          required: true,
          help: 'Modelo oficial recomendado de Groq para chat e inferencia ultra rápida.'
        }
      ]
    },
    deploy: {
      id: 'deploy',
      nombre: 'Despliegue',
      encargado: 'Teo',
      rol: 'Operador de despliegues',
      tipo: 'despliegue',
      color: '#4c8f9b',
      ready: true,
      fields: [
        {
          id: 'buildHookUrl',
          label: 'URL del Build Hook de Netlify',
          type: 'password',
          placeholder: 'https://api.netlify.com/build_hooks/...',
          required: true,
          help: 'URL generada en Netlify: Site configuration > Build & deploy > Continuous deployment > Build hooks.'
        }
      ]
    },
    database: {
      id: 'database',
      nombre: 'Base de datos en la nube',
      encargado: 'Vera',
      rol: 'Administradora de datos',
      tipo: 'servidores',
      color: '#b6984f',
      ready: false,
      proximamente: true
    },
    drive: {
      id: 'drive',
      nombre: 'Almacenamiento (Drive)',
      encargado: 'Omar',
      rol: 'Archivista digital',
      tipo: 'archivos',
      color: '#5e8c72',
      ready: false,
      proximamente: true
    },
    mail: {
      id: 'mail',
      nombre: 'Correo y calendario',
      encargado: 'Sara',
      rol: 'Coordinadora de comunicaciones',
      tipo: 'agenda',
      color: '#c78461',
      ready: false,
      proximamente: true
    }
  };
});
