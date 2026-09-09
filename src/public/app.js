const statusBox = document.getElementById('status-box');
const messages = document.getElementById('messages');
const statusMqttMessage = document.getElementById('status-mqtt-message');
const statusOpcMessage = document.getElementById('status-opc-message');
const mappingsList = document.getElementById('mappings-list');
const mappingTemplate = document.getElementById('mapping-template');
const opcServerTemplate = document.getElementById('opc-server-template');
const opcServersList = document.getElementById('opc-servers-list');
const opcDefaultServerSelect = document.getElementById('opc-default-server');
const appShell = document.getElementById('app-shell');
const loginShell = document.getElementById('login-shell');
const loginForm = document.getElementById('login-form');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const loginErrorBox = document.getElementById('login-error');
const navUsernameLabel = document.getElementById('nav-username');
const navRoleLabel = document.getElementById('nav-role-label');
const heroRoleLabel = document.getElementById('hero-role-label');
const logoutButton = document.getElementById('btn-logout');
const langToggleButton = document.getElementById('btn-lang-toggle');
const themeToggleButton = document.getElementById('btn-theme-toggle');
const langToggleLoginButton = document.getElementById('btn-lang-toggle-login');
const themeToggleLoginButton = document.getElementById('btn-theme-toggle-login');
const langToggleModalButton = document.getElementById('btn-lang-toggle-modal');
const themeToggleModalButton = document.getElementById('btn-theme-toggle-modal');
const configSaveStatus = document.getElementById('save-status-indicator');
const opcServersSaveStatus = document.getElementById('opc-save-status-indicator');

const modal = document.getElementById('tag-browser-modal');
const browserCurrentNodeInput = document.getElementById('browser-current-node');
const browserSelectedNodeInput = document.getElementById('browser-selected-node');
const browserNodeValueBox = document.getElementById('browser-node-value');
const browserList = document.getElementById('browser-list');
const browserActiveTargetLabel = document.getElementById('browser-active-target');
const browserSearchInput = document.getElementById('browser-search');
const browserServerSelect = document.getElementById('browser-server-select');
const backupFileInput = document.getElementById('backup-file-input');
const backupFileNameInput = document.getElementById('backup-file-name');
const backupDownloadButton = document.getElementById('btn-download-backup');
const backupImportButton = document.getElementById('btn-import-backup');
const backupImportModeModal = document.getElementById('backup-import-mode-modal');
const backupImportModeSelectedFile = document.getElementById('backup-import-mode-selected-file');
const backupImportModeCloseButton = document.getElementById('btn-close-backup-import-modal');
const backupImportModeCancelButton = document.getElementById('btn-cancel-backup-import');
const backupImportModeConfirmButton = document.getElementById('btn-confirm-backup-import');
const backupPreviewOpcCount = document.getElementById('backup-preview-opc-count');
const backupPreviewMappingsCount = document.getElementById('backup-preview-mappings-count');
const expandAllOpcButton = document.getElementById('btn-expand-all-opc');
const collapseAllOpcButton = document.getElementById('btn-collapse-all-opc');
const expandAllMappingsButton = document.getElementById('btn-expand-all-mappings');
const collapseAllMappingsButton = document.getElementById('btn-collapse-all-mappings');

const cfgFields = {
  mqttUrl: document.getElementById('mqtt-url'),
  mqttUsername: document.getElementById('mqtt-username'),
  mqttPassword: document.getElementById('mqtt-password'),
  mqttClientId: document.getElementById('mqtt-client-id'),
  mqttQos: document.getElementById('mqtt-qos'),
  mqttRetain: document.getElementById('mqtt-retain'),
  topicOee: document.getElementById('topic-oee'),
  topicEstop: document.getElementById('topic-estop'),
  pollInterval: document.getElementById('poll-interval'),
  connectmesBaseUrl: document.getElementById('connectmes-base-url'),
  connectmesStationsPath: document.getElementById('connectmes-stations-path'),
  connectmesToken: document.getElementById('connectmes-token'),
};

const AUTH_TOKEN_KEY = 'connectmes_bridge_token';
const UI_LANG_KEY = 'connectmes_bridge_lang';
const UI_THEME_KEY = 'connectmes_bridge_theme';
const SUPPORTED_LANGS = ['es', 'en'];
let backupImportDraft = null;

const translations = {
  es: {
    'login.subtitle': 'Inicio de sesión para administración del OPC UA Bridge',
    'login.username': 'Usuario',
    'login.password': 'Password',
    'login.submit': 'Iniciar sesión',
    'login.validating': 'Validando...',
    'login.note': 'Acceso habilitado solo para rol Optimotion.',
    'login.fillFields': 'Completa usuario y password.',
    'login.sessionExpired': 'Tu sesión expiró o no tienes permisos.',
    'hero.subtitle': 'Optimización Integral para Producción',
    'hero.modules': 'Módulos MES',
    'nav.welcome': 'Bienvenido',
    'nav.logout': 'Cerrar sesión',
    'tabs.status': 'Estado',
    'tabs.settings': 'Configuracion',
    'tabs.opcServers': 'Servidores OPC',
    'tabs.mappings': 'Mapeo estaciones',
    'tabs.backup': 'Respaldo',
    'status.title': 'Estado runtime',
    'status.messages': 'Mensajes',
    'status.connections': 'Conexiones',
    'status.mqtt': 'MQTT',
    'status.opcServersTitle': 'Servidores OPC UA',
    'status.loading': 'Cargando...',
    'status.waiting': 'Esperando estado...',
    'settings.title': 'Configuracion general',
    'settings.topicA': 'Canal A',
    'settings.topicB': 'Canal B',
    'settings.mqttUrl': 'MQTT URL',
    'settings.mqttUsername': 'MQTT Usuario',
    'settings.mqttPassword': 'MQTT Password',
    'settings.mqttClientId': 'MQTT Client ID',
    'settings.mqttQos': 'MQTT QoS',
    'settings.mqttRetain': 'MQTT Retain',
    'settings.pollInterval': 'Poll Interval (ms)',
    'settings.connectmesApiUrl': 'ConnectMES API URL',
    'settings.connectmesStationsPath': 'Stations Path',
    'settings.connectmesToken': 'ConnectMES API Token',
    'settings.defaultOpcServer': 'Servidor OPC por defecto',
    'status.service': 'Servicio',
    'status.name': 'Nombre',
    'status.endpoint': 'Endpoint',
    'status.state': 'Estado',
    'status.message': 'Mensaje',
    'actions.refresh': 'Refrescar',
    'actions.saveConfig': 'Guardar configuracion',
    'actions.reconnect': 'Reconectar runtime',
    'actions.reloadStations': 'Recargar estaciones',
    'actions.close': 'Cerrar',
    'actions.delete': 'Eliminar',
    'actions.expand': 'Expandir',
    'actions.collapse': 'Colapsar',
    'actions.expandAll': 'Expandir todo',
    'actions.collapseAll': 'Colapsar todo',
    'opc.title': 'Servidores OPC UA',
    'opc.add': 'Agregar servidor OPC',
    'opc.hint': 'Define multiples OPC servers y el servidor por defecto para browsing y mappings nuevos.',
    'opc.save': 'Guardar servidores OPC',
    'opc.itemTitle': 'Servidor OPC',
    'opc.authType': 'Autenticacion OPC',
    'opc.authAnonymous': 'Anonimo',
    'opc.authUsername': 'Usuario/Password',
    'opc.authCertificate': 'Certificado de usuario',
    'opc.authHint': 'Puedes usar anonimo, usuario/password o certificado X509 de usuario segun soporte del servidor OPC.',
    'opc.username': 'Usuario OPC',
    'opc.password': 'Password OPC',
    'opc.userCertFile': 'Ruta certificado usuario',
    'opc.userKeyFile': 'Ruta llave privada usuario',
    'opc.uploadCert': 'Archivo certificado',
    'opc.uploadKey': 'Archivo llave privada',
    'opc.uploadAction': 'Subir archivos al bridge',
    'opc.deleteUpload': 'Eliminar certificados subidos',
    'opc.userCertRef': 'Certificado cargado (interno)',
    'opc.userKeyRef': 'Llave cargada (interna)',
    'opc.uploadDone': 'Certificado y llave cargados para {serverId}. Guarda servidores OPC para aplicar cambios.',
    'opc.uploadNeedServerId': 'Define primero el ID del servidor OPC para subir certificados.',
    'opc.uploadNeedFiles': 'Selecciona certificado y llave privada antes de subir.',
    'opc.deleteDone': 'Certificados subidos eliminados para {serverId}. Guarda servidores OPC para aplicar cambios.',
    'opc.deleteNeedServerId': 'Define primero el ID del servidor OPC para eliminar certificados subidos.',
    'mappings.title': 'Mapeo de estaciones y tags',
    'mappings.add': 'Agregar estacion',
    'mappings.hint': 'Selecciona la estacion de ConnectMES para autocompletar contexto operativo. Puedes escribir NodeId manual o usar la lupa.',
    'mappings.save': 'Guardar mappings',
    'mappings.station': 'Estación',
    'mappings.facility': 'Facility',
    'mappings.area': 'Area',
    'mappings.line': 'Linea',
    'mappings.stationConnectmes': 'Estacion ConnectMES',
    'mappings.site': 'Sitio',
    'mappings.zone': 'Zona',
    'mappings.cell': 'Celda',
    'mappings.opcServer': 'Servidor OPC',
    'mappings.functionalities': 'Funcionalidades y canales',
    'mappings.addFunctionality': 'Agregar funcionalidad',
    'mappings.removeFunctionality': 'Eliminar funcionalidad',
    'mappings.functionalityName': 'Nombre funcionalidad',
    'mappings.functionalityType': 'Tipo funcionalidad',
    'mappings.functionalityPieceCount': 'Conteo de piezas',
    'mappings.functionalityMachineStates': 'Estados de máquina (marcha/paro)',
    'mappings.functionalityCustom': 'Personalizada',
    'mappings.topicOptional': 'Canal / tópico (opcional)',
    'mappings.enabled': 'Habilitada',
    'mappings.onlyOnChange': 'Solo publicar por cambio',
    'mappings.triggerEvents': 'Eventos de disparo',
    'mappings.addTriggerEvent': 'Agregar evento',
    'mappings.triggerType': 'Tipo de disparo',
    'mappings.triggerProperty': 'Propiedad para cambio de valor',
    'mappings.triggerSeconds': 'Segundos',
    'mappings.removeTrigger': 'Eliminar evento',
    'mappings.functionalitySignals': 'Señales OPC de la funcionalidad',
    'mappings.noSignalsForType': 'Esta funcionalidad no requiere señales fijas todavía.',
    'mappings.typeAlreadyUsed': 'Ese tipo ya existe en esta estación. Elige otro tipo.',
    'mappings.topicAOptional': 'Canal A (opcional)',
    'mappings.topicBOptional': 'Canal B (opcional)',
    'mappings.sampleScale': 'Escala de muestreo',
    'mappings.publishA': 'Publicar flujo A',
    'mappings.publishB': 'Publicar flujo B',
    'mappings.onlyOnChangeA': 'Flujo A solo por cambio',
    'mappings.onlyOnChangeB': 'Flujo B solo por cambio',
    'mappings.tags': 'Señales OPC -> Campos de salida',
    'mappings.trigger': 'Trigger de disparo',
    'mappings.modeA': 'Modo flujo A',
    'mappings.modeB': 'Modo flujo B',
    'mappings.triggerA': 'Tag disparo flujo A',
    'mappings.triggerB': 'Tag disparo flujo B',
    'mappings.modeAlways': 'Siempre',
    'mappings.modeOnChange': 'Por cambio de valor',
    'mappings.modeInterval': 'Cada X segundos',
    'mappings.intervalA': 'Segundos flujo A',
    'mappings.intervalB': 'Segundos flujo B',
    'mappings.selectFacility': 'Selecciona facility...',
    'mappings.selectArea': 'Selecciona area...',
    'mappings.selectLine': 'Selecciona linea...',
    'mappings.selectStation': 'Selecciona una estacion...',
    'mapping.field.marcha': 'Señal de operación',
    'mapping.field.parts_count': 'Contador principal',
    'mapping.field.parts_rejected': 'Contador secundario',
    'mapping.field.Resolution': 'Escala de muestreo',
    'mapping.field.estop_status': 'Estado de evento',
    'mapping.field.estop_motive': 'Código de evento',
    'browser.title': 'Selector de Tag OPC UA',
    'browser.back': 'Atras',
    'browser.root': 'Ir a RootFolder',
    'browser.browse': 'Browse nodo',
    'browser.read': 'Leer valor',
    'browser.use': 'Usar seleccionado',
    'browser.clearFilter': 'Limpiar filtro',
    'browser.select': 'Seleccionar',
    'browser.useShort': 'Usar',
    'browser.expand': 'Expandir',
    'browser.collapse': 'Colapsar',
    'browser.loading': 'Cargando...',
    'browser.noChildren': 'Sin nodos hijos',
    'browser.noMatches': 'Sin coincidencias con el filtro',
    'browser.activeNone': 'Campo activo: ninguno',
    'browser.activeField': 'Campo activo: {field}',
    'browser.fieldFallback': 'campo',
    'browser.selected': 'Nodo seleccionado: {nodeId}',
    'browser.browseOk': 'Browse OK: {count} nodos hijos',
    'browser.selectFirst': 'Selecciona primero un nodo',
    'browser.selectBrowserNode': 'Selecciona un nodo del browser',
    'browser.selectDestination': 'Primero selecciona un campo destino',
    'browser.applied': 'NodeId aplicado: {nodeId}',
    'browser.noHistory': 'No hay historial',
    'browser.readDone': 'Lectura realizada',
    'status.updated': 'Estado actualizado',
    'settings.saved': 'Configuracion guardada',
    'settings.opcSaved': 'Servidores OPC guardados',
    'settings.reconnected': 'Runtime reconectado',
    'settings.stationsReloaded': 'Estaciones recargadas desde ConnectMES',
    'mappings.saved': 'Mappings guardados',
    'backup.title': 'Respaldo de configuración',
    'backup.hint': 'Descarga un archivo con toda la configuración del bridge o importa un respaldo para restaurarla.',
    'backup.download': 'Descargar respaldo',
    'backup.import': 'Importar respaldo',
    'backup.file': 'Archivo de respaldo (JSON)',
    'backup.selected': 'Archivo seleccionado',
    'backup.noneSelected': 'Ninguno',
    'backup.fileRequired': 'Selecciona un archivo de respaldo JSON para importar.',
    'backup.invalidFormat': 'El archivo no tiene un formato de respaldo válido.',
    'backup.imported': 'Respaldo importado correctamente.',
    'backup.importedOverwrite': 'Respaldo importado con sobrescritura completa.',
    'backup.importedMerge': 'Respaldo importado en modo merge.',
    'backup.downloaded': 'Respaldo descargado.',
    'backup.importMode.title': 'Modo de importación',
    'backup.importMode.hint': 'Elige cómo aplicar el respaldo seleccionado.',
    'backup.importMode.overwrite': 'Sobrescribir todo',
    'backup.importMode.overwriteDesc': 'Reemplaza toda la configuración actual con el contenido del archivo.',
    'backup.importMode.merge': 'Hacer merge',
    'backup.importMode.mergeDesc': 'Conserva lo existente y combina con el archivo. En conflictos, gana el respaldo importado.',
    'backup.importMode.cancel': 'Cancelar',
    'backup.importMode.confirm': 'Continuar importación',
    'backup.importMode.fileLabel': 'Archivo: {name}',
    'backup.importMode.previewTitle': 'Contenido detectado',
    'backup.importMode.previewOpc': 'Servidores OPC en archivo',
    'backup.importMode.previewMappings': 'Mappings en archivo',
    'connectmes.stationsError': 'No se pudieron cargar estaciones de ConnectMES: {error}',
    'station.contextCompact': 'S:{site} Z:{zone} C:{cell}',
    'common.na': 'N/D',
    'theme.light': 'Claro',
    'theme.dark': 'Oscuro',
  },
  en: {
    'login.subtitle': 'Sign in to manage the OPC UA Bridge',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.submit': 'Sign in',
    'login.validating': 'Validating...',
    'login.note': 'Access is currently limited to the Optimotion role.',
    'login.fillFields': 'Please provide username and password.',
    'login.sessionExpired': 'Your session expired or you do not have permissions.',
    'hero.subtitle': 'Integrated Production Optimization',
    'hero.modules': 'MES Modules',
    'nav.welcome': 'Welcome',
    'nav.logout': 'Sign out',
    'tabs.status': 'Status',
    'tabs.settings': 'Settings',
    'tabs.opcServers': 'OPC Servers',
    'tabs.mappings': 'Station Mapping',
    'tabs.backup': 'Backup',
    'status.title': 'Runtime status',
    'status.messages': 'Messages',
    'status.connections': 'Connections',
    'status.mqtt': 'MQTT',
    'status.opcServersTitle': 'OPC UA Servers',
    'status.loading': 'Loading...',
    'status.waiting': 'Waiting for status...',
    'settings.title': 'General settings',
    'settings.topicA': 'Channel A',
    'settings.topicB': 'Channel B',
    'settings.mqttUrl': 'MQTT URL',
    'settings.mqttUsername': 'MQTT Username',
    'settings.mqttPassword': 'MQTT Password',
    'settings.mqttClientId': 'MQTT Client ID',
    'settings.mqttQos': 'MQTT QoS',
    'settings.mqttRetain': 'MQTT Retain',
    'settings.pollInterval': 'Poll Interval (ms)',
    'settings.connectmesApiUrl': 'ConnectMES API URL',
    'settings.connectmesStationsPath': 'Stations Path',
    'settings.connectmesToken': 'ConnectMES API Token',
    'settings.defaultOpcServer': 'Default OPC server',
    'status.service': 'Service',
    'status.name': 'Name',
    'status.endpoint': 'Endpoint',
    'status.state': 'State',
    'status.message': 'Message',
    'actions.refresh': 'Refresh',
    'actions.saveConfig': 'Save settings',
    'actions.reconnect': 'Reconnect runtime',
    'actions.reloadStations': 'Reload stations',
    'actions.close': 'Close',
    'actions.delete': 'Delete',
    'actions.expand': 'Expand',
    'actions.collapse': 'Collapse',
    'actions.expandAll': 'Expand all',
    'actions.collapseAll': 'Collapse all',
    'opc.title': 'OPC UA Servers',
    'opc.add': 'Add OPC server',
    'opc.hint': 'Define multiple OPC servers and set a default server for browsing and new mappings.',
    'opc.save': 'Save OPC servers',
    'opc.itemTitle': 'OPC Server',
    'opc.authType': 'OPC authentication',
    'opc.authAnonymous': 'Anonymous',
    'opc.authUsername': 'Username/Password',
    'opc.authCertificate': 'User certificate',
    'opc.authHint': 'Use anonymous, username/password, or X509 user certificate based on OPC server support.',
    'opc.username': 'OPC username',
    'opc.password': 'OPC password',
    'opc.userCertFile': 'User certificate path',
    'opc.userKeyFile': 'User private key path',
    'opc.uploadCert': 'Certificate file',
    'opc.uploadKey': 'Private key file',
    'opc.uploadAction': 'Upload files to bridge',
    'opc.deleteUpload': 'Delete uploaded certificates',
    'opc.userCertRef': 'Uploaded certificate (internal)',
    'opc.userKeyRef': 'Uploaded private key (internal)',
    'opc.uploadDone': 'Certificate and key uploaded for {serverId}. Save OPC servers to apply changes.',
    'opc.uploadNeedServerId': 'Set an OPC server ID before uploading certificates.',
    'opc.uploadNeedFiles': 'Select certificate and private key files before uploading.',
    'opc.deleteDone': 'Uploaded certificates removed for {serverId}. Save OPC servers to apply changes.',
    'opc.deleteNeedServerId': 'Set an OPC server ID before deleting uploaded certificates.',
    'mappings.title': 'Station and tag mapping',
    'mappings.add': 'Add station',
    'mappings.hint': 'Select a ConnectMES station to auto-fill operational context. You can type a NodeId manually or use the picker.',
    'mappings.save': 'Save mappings',
    'mappings.station': 'Station',
    'mappings.facility': 'Facility',
    'mappings.area': 'Area',
    'mappings.line': 'Line',
    'mappings.stationConnectmes': 'ConnectMES station',
    'mappings.site': 'Site',
    'mappings.zone': 'Zone',
    'mappings.cell': 'Cell',
    'mappings.opcServer': 'OPC server',
    'mappings.functionalities': 'Functionalities and channels',
    'mappings.addFunctionality': 'Add functionality',
    'mappings.removeFunctionality': 'Remove functionality',
    'mappings.functionalityName': 'Functionality name',
    'mappings.functionalityType': 'Functionality type',
    'mappings.functionalityPieceCount': 'Piece count',
    'mappings.functionalityMachineStates': 'Machine states (run/stop)',
    'mappings.functionalityCustom': 'Custom',
    'mappings.topicOptional': 'Channel / topic (optional)',
    'mappings.enabled': 'Enabled',
    'mappings.onlyOnChange': 'Publish only on change',
    'mappings.triggerEvents': 'Trigger events',
    'mappings.addTriggerEvent': 'Add event',
    'mappings.triggerType': 'Trigger type',
    'mappings.triggerProperty': 'Property for value change',
    'mappings.triggerSeconds': 'Seconds',
    'mappings.removeTrigger': 'Remove event',
    'mappings.functionalitySignals': 'Function OPC signals',
    'mappings.noSignalsForType': 'This functionality does not require fixed signals yet.',
    'mappings.typeAlreadyUsed': 'That type already exists in this station. Choose another type.',
    'mappings.topicAOptional': 'Channel A (optional)',
    'mappings.topicBOptional': 'Channel B (optional)',
    'mappings.sampleScale': 'Sampling scale',
    'mappings.publishA': 'Publish stream A',
    'mappings.publishB': 'Publish stream B',
    'mappings.onlyOnChangeA': 'Stream A only on change',
    'mappings.onlyOnChangeB': 'Stream B only on change',
    'mappings.tags': 'OPC Signals -> Output fields',
    'mappings.trigger': 'Trigger mode',
    'mappings.modeA': 'Stream A mode',
    'mappings.modeB': 'Stream B mode',
    'mappings.triggerA': 'Stream A trigger tag',
    'mappings.triggerB': 'Stream B trigger tag',
    'mappings.modeAlways': 'Always',
    'mappings.modeOnChange': 'On value change',
    'mappings.modeInterval': 'Every X seconds',
    'mappings.intervalA': 'Stream A seconds',
    'mappings.intervalB': 'Stream B seconds',
    'mappings.selectFacility': 'Select facility...',
    'mappings.selectArea': 'Select area...',
    'mappings.selectLine': 'Select line...',
    'mappings.selectStation': 'Select a station...',
    'mapping.field.marcha': 'Run signal',
    'mapping.field.parts_count': 'Primary counter',
    'mapping.field.parts_rejected': 'Secondary counter',
    'mapping.field.Resolution': 'Sampling scale',
    'mapping.field.estop_status': 'Event state',
    'mapping.field.estop_motive': 'Event code',
    'browser.title': 'OPC UA Tag Picker',
    'browser.back': 'Back',
    'browser.root': 'Go to RootFolder',
    'browser.browse': 'Browse node',
    'browser.read': 'Read value',
    'browser.use': 'Use selected',
    'browser.clearFilter': 'Clear filter',
    'browser.select': 'Select',
    'browser.useShort': 'Use',
    'browser.expand': 'Expand',
    'browser.collapse': 'Collapse',
    'browser.loading': 'Loading...',
    'browser.noChildren': 'No child nodes',
    'browser.noMatches': 'No matches with current filter',
    'browser.activeNone': 'Active field: none',
    'browser.activeField': 'Active field: {field}',
    'browser.fieldFallback': 'field',
    'browser.selected': 'Selected node: {nodeId}',
    'browser.browseOk': 'Browse OK: {count} child nodes',
    'browser.selectFirst': 'Select a node first',
    'browser.selectBrowserNode': 'Select a node from the browser',
    'browser.selectDestination': 'Select a destination field first',
    'browser.applied': 'NodeId applied: {nodeId}',
    'browser.noHistory': 'No browsing history',
    'browser.readDone': 'Read completed',
    'status.updated': 'Status updated',
    'settings.saved': 'Settings saved',
    'settings.opcSaved': 'OPC servers saved',
    'settings.reconnected': 'Runtime reconnected',
    'settings.stationsReloaded': 'Stations reloaded from ConnectMES',
    'mappings.saved': 'Mappings saved',
    'backup.title': 'Configuration backup',
    'backup.hint': 'Download a file with the full bridge configuration or import a backup to restore it.',
    'backup.download': 'Download backup',
    'backup.import': 'Import backup',
    'backup.file': 'Backup file (JSON)',
    'backup.selected': 'Selected file',
    'backup.noneSelected': 'None',
    'backup.fileRequired': 'Select a JSON backup file to import.',
    'backup.invalidFormat': 'The file does not contain a valid backup format.',
    'backup.imported': 'Backup imported successfully.',
    'backup.importedOverwrite': 'Backup imported with full overwrite.',
    'backup.importedMerge': 'Backup imported in merge mode.',
    'backup.downloaded': 'Backup downloaded.',
    'backup.importMode.title': 'Import mode',
    'backup.importMode.hint': 'Choose how to apply the selected backup.',
    'backup.importMode.overwrite': 'Overwrite all',
    'backup.importMode.overwriteDesc': 'Replaces the entire current configuration with the file content.',
    'backup.importMode.merge': 'Merge',
    'backup.importMode.mergeDesc': 'Keeps current settings and combines with the file. On conflicts, imported backup wins.',
    'backup.importMode.cancel': 'Cancel',
    'backup.importMode.confirm': 'Continue import',
    'backup.importMode.fileLabel': 'File: {name}',
    'backup.importMode.previewTitle': 'Detected content',
    'backup.importMode.previewOpc': 'OPC servers in file',
    'backup.importMode.previewMappings': 'Mappings in file',
    'connectmes.stationsError': 'Could not load ConnectMES stations: {error}',
    'station.contextCompact': 'S:{site} Z:{zone} C:{cell}',
    'common.na': 'N/A',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
  },
};

const SIGNAL_DEFINITIONS_BY_TYPE = {
  pieceCount: [
    { key: 'marcha', labelKey: 'mapping.field.marcha', placeholder: 'ns=3;s=Device.Signal01' },
    { key: 'parts_count', labelKey: 'mapping.field.parts_count', placeholder: 'ns=3;s=Device.Counter01' },
    { key: 'parts_rejected', labelKey: 'mapping.field.parts_rejected', placeholder: 'ns=3;s=Device.Counter02' },
    { key: 'Resolution', labelKey: 'mapping.field.Resolution', placeholder: 'ns=3;s=Device.Scale01' },
  ],
  machineStates: [
    { key: 'estop_status', labelKey: 'mapping.field.estop_status', placeholder: 'ns=3;s=Device.Flag01' },
    { key: 'estop_motive', labelKey: 'mapping.field.estop_motive', placeholder: 'ns=3;s=Device.Code01' },
  ],
  custom: [],
};

const appState = {
  config: null,
  mappings: [],
  stations: [],
  stationsById: new Map(),
  user: null,
  lang: 'es',
  theme: 'light',
};

const browserState = {
  history: [],
  currentNodeId: 'RootFolder',
  selectedNodeId: '',
  activeTargetInput: null,
  childrenByNodeId: new Map(),
  expandedNodeIds: new Set(),
  loadingNodeIds: new Set(),
  searchQuery: '',
  selectedServerId: '',
};

function showMessage(text, isError = false) {
  messages.textContent = text;
  messages.style.color = isError ? '#b91c1c' : '#0b3a6e';
}

function setUploadStatus(card, text, tone = 'neutral') {
  const statusEl = card?.querySelector('[data-field="upload-status"]');
  if (!statusEl) return;

  statusEl.textContent = text || 'Sin estado';
  statusEl.classList.remove('hidden', 'success', 'warning', 'error', 'saving');

  if (!text) {
    statusEl.classList.add('hidden');
    return;
  }

  statusEl.classList.add(tone);
}

function updateUploadFileSummary(card) {
  const summaryEl = card?.querySelector('[data-field="upload-file-summary"]');
  const certInput = card?.querySelector('[data-field="uploadCertificateFile"]');
  const keyInput = card?.querySelector('[data-field="uploadPrivateKeyFile"]');
  if (!summaryEl) return;

  const certName = certInput?.files?.[0]?.name || null;
  const keyName = keyInput?.files?.[0]?.name || null;

  if (certName || keyName) {
    summaryEl.textContent = [certName, keyName].filter(Boolean).join(' · ');
    return;
  }

  summaryEl.textContent = 'Sin archivos seleccionados';
}

function setSaveStatus(element, text, tone = 'neutral') {
  if (!element) return;
  element.textContent = text;
  element.classList.remove('hidden', 'saving', 'success', 'warning', 'error');

  if (!text) {
    element.classList.add('hidden');
    return;
  }

  element.classList.add(tone);
}

function clearSaveStatus() {
  setSaveStatus(configSaveStatus, '', 'neutral');
  setSaveStatus(opcServersSaveStatus, '', 'neutral');
}

function getCurrentLanguage() {
  const stored = String(localStorage.getItem(UI_LANG_KEY) || '').trim().toLowerCase();
  if (SUPPORTED_LANGS.includes(stored)) return stored;
  return 'es';
}

function t(key) {
  const lang = appState.lang || 'es';
  return translations[lang]?.[key] || translations.es?.[key] || key;
}

function tf(key, params = {}) {
  return t(key).replace(/\{(\w+)\}/g, (_full, name) => String(params[name] ?? ''));
}

function applyTranslationsInRoot(root) {
  if (!root) return;
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && 'placeholder' in el) {
      el.placeholder = t(key);
    }
  });
}

function applyTranslations() {
  applyTranslationsInRoot(document);

  document.querySelectorAll('template').forEach((tpl) => {
    applyTranslationsInRoot(tpl.content);
  });

  const langLabel = appState.lang.toUpperCase();
  if (langToggleButton) langToggleButton.textContent = langLabel;
  if (langToggleLoginButton) langToggleLoginButton.textContent = langLabel;

  if (themeToggleButton) {
    themeToggleButton.textContent = appState.theme === 'dark' ? t('theme.dark') : t('theme.light');
  }
  if (themeToggleLoginButton) {
    themeToggleLoginButton.textContent = appState.theme === 'dark' ? t('theme.dark') : t('theme.light');
  }
  if (langToggleModalButton) {
    langToggleModalButton.textContent = langLabel;
  }
  if (themeToggleModalButton) {
    themeToggleModalButton.textContent = appState.theme === 'dark' ? t('theme.dark') : t('theme.light');
  }

  const stationSelects = document.querySelectorAll('[data-field="stationId"]');
  stationSelects.forEach((selectEl) => {
    const selected = selectEl.value;
    populateStationSelect(selectEl, selected);
  });

  document.querySelectorAll('[data-field="station-title"]').forEach((title) => {
    if (!title.textContent || title.textContent.trim() === 'N/A') {
      title.textContent = t('common.na');
    }
  });

  document.querySelectorAll('.mapping-item').forEach((card) => {
    refreshCollapseButton(card);
  });

  refreshImportModeOptionsUi();

  if (backupImportModeModal && !backupImportModeModal.classList.contains('hidden') && backupImportModeSelectedFile) {
    const file = backupFileInput?.files?.[0] || null;
    backupImportModeSelectedFile.textContent = tf('backup.importMode.fileLabel', {
      name: file?.name || t('backup.noneSelected'),
    });
  }

  setActiveTarget(browserState.activeTargetInput);
  if (modal && !modal.classList.contains('hidden')) {
    renderBrowserTree();
  }
}

let collapseRegionIdCounter = 0;

function getCardCollapseType(card) {
  if (card.classList.contains('opc-server-item')) return 'opc';
  return 'mapping';
}

function ensureCollapseRegionId(region) {
  if (!region.id) {
    collapseRegionIdCounter += 1;
    region.id = `collapse-region-${collapseRegionIdCounter}`;
  }
  return region.id;
}

function refreshCollapseButton(card) {
  const btn = card.querySelector('[data-action="toggle-collapse"]');
  const collapsed = card.classList.contains('is-collapsed');
  if (!btn) return;
  btn.textContent = collapsed ? t('actions.expand') : t('actions.collapse');
}

function setCardCollapsed(card, collapsed) {
  const region = card.querySelector('[data-collapsible-body]');
  const toggleBtn = card.querySelector('[data-action="toggle-collapse"]');
  if (!region || !toggleBtn) return;

  const regionId = ensureCollapseRegionId(region);
  const isCollapsed = Boolean(collapsed);

  card.classList.toggle('is-collapsed', isCollapsed);
  toggleBtn.setAttribute('aria-controls', regionId);
  toggleBtn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
  region.setAttribute('aria-hidden', isCollapsed ? 'true' : 'false');
  region.setAttribute('role', 'region');

  refreshCollapseButton(card);
}

function initCollapsibleCard(card, collapseType, collapsed = true) {
  const region = card.querySelector('[data-collapsible-body]');
  const toggleBtn = card.querySelector('[data-action="toggle-collapse"]');
  if (!region || !toggleBtn) return;

  card.dataset.collapseType = collapseType;
  setCardCollapsed(card, collapsed);

  toggleBtn.addEventListener('click', () => {
    const nextCollapsed = !card.classList.contains('is-collapsed');
    setCardCollapsed(card, nextCollapsed);
  });
}

function setCardsCollapsedByType(collapseType, collapsed) {
  document.querySelectorAll(`.mapping-item[data-collapse-type="${collapseType}"]`).forEach((card) => {
    setCardCollapsed(card, collapsed);
  });
}

function refreshImportModeOptionsUi() {
  document.querySelectorAll('input[name="backup-import-mode"]').forEach((input) => {
    const option = input.closest('.import-mode-option');
    if (!option) return;
    option.classList.toggle('selected', input.checked);
  });
}

function openBackupImportModeModal(fileName) {
  if (!backupImportModeModal) return;
  if (backupImportModeSelectedFile) {
    backupImportModeSelectedFile.textContent = tf('backup.importMode.fileLabel', {
      name: fileName || t('backup.noneSelected'),
    });
  }

  const overwrite = document.querySelector('input[name="backup-import-mode"][value="overwrite"]');
  if (overwrite) overwrite.checked = true;
  refreshImportModeOptionsUi();
  refreshBackupImportPreview();

  backupImportModeModal.classList.remove('hidden');
  backupImportModeModal.setAttribute('aria-hidden', 'false');
}

function closeBackupImportModeModal() {
  if (!backupImportModeModal) return;
  backupImportModeModal.classList.add('hidden');
  backupImportModeModal.setAttribute('aria-hidden', 'true');
  backupImportDraft = null;
}

function getBackupImportSummary(normalized) {
  const servers = Array.isArray(normalized?.config?.opcua?.servers) ? normalized.config.opcua.servers : [];
  const mappings = Array.isArray(normalized?.mappings) ? normalized.mappings : [];

  return {
    opcServers: servers.length,
    mappings: mappings.length,
  };
}

function refreshBackupImportPreview() {
  const summary = getBackupImportSummary(backupImportDraft);
  if (backupPreviewOpcCount) backupPreviewOpcCount.textContent = String(summary.opcServers);
  if (backupPreviewMappingsCount) backupPreviewMappingsCount.textContent = String(summary.mappings);
}

function getSelectedBackupImportMode() {
  const selected = document.querySelector('input[name="backup-import-mode"]:checked');
  const value = String(selected?.value || 'overwrite').trim();
  return value === 'merge' ? 'merge' : 'overwrite';
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function deepMergeObjects(baseValue, overrideValue) {
  if (overrideValue === undefined) return baseValue;

  if (!isPlainObject(baseValue) || !isPlainObject(overrideValue)) {
    return overrideValue;
  }

  const merged = { ...baseValue };
  for (const [key, value] of Object.entries(overrideValue)) {
    const baseChild = merged[key];
    merged[key] = deepMergeObjects(baseChild, value);
  }

  return merged;
}

function mergeOpcServersById(currentServers = [], importedServers = []) {
  const byId = new Map();
  const order = [];

  for (const server of currentServers) {
    const id = String(server?.id || '').trim();
    if (!id || byId.has(id)) continue;
    byId.set(id, { ...server });
    order.push(id);
  }

  for (const server of importedServers) {
    const id = String(server?.id || '').trim();
    if (!id) continue;
    byId.set(id, { ...server });
    if (!order.includes(id)) order.push(id);
  }

  return order.map((id) => byId.get(id)).filter(Boolean);
}

function mergeBridgeConfig(currentConfig, importedConfig) {
  const base = isPlainObject(currentConfig) ? currentConfig : {};
  const incoming = isPlainObject(importedConfig) ? importedConfig : {};
  const merged = deepMergeObjects(base, incoming);

  const currentServers = Array.isArray(base?.opcua?.servers) ? base.opcua.servers : [];
  const importedServers = Array.isArray(incoming?.opcua?.servers) ? incoming.opcua.servers : [];

  if (currentServers.length || importedServers.length) {
    merged.opcua = isPlainObject(merged.opcua) ? merged.opcua : {};
    merged.opcua.servers = mergeOpcServersById(currentServers, importedServers);
  }

  return merged;
}

function sanitizeConfigForBackup(config = {}) {
  const normalizedConfig = isPlainObject(config) ? { ...config } : {};
  const opcua = isPlainObject(normalizedConfig.opcua) ? { ...normalizedConfig.opcua } : {};
  const servers = Array.isArray(opcua.servers) ? opcua.servers : [];

  opcua.servers = servers.map((server, idx) => sanitizeOpcServerForBackup(server, idx));
  normalizedConfig.opcua = opcua;
  return normalizedConfig;
}

function getMappingMergeKey(mapping) {
  const stationId = Number.parseInt(String(mapping?.stationId || '0'), 10) || 0;
  const opcServerId = String(mapping?.opcServerId || '').trim();
  return `${stationId}|${opcServerId}`;
}

function mergeMappingsByKey(currentMappings = [], importedMappings = []) {
  const merged = [...currentMappings];
  const indexByKey = new Map();

  merged.forEach((mapping, index) => {
    indexByKey.set(getMappingMergeKey(mapping), index);
  });

  for (const mapping of importedMappings) {
    const key = getMappingMergeKey(mapping);
    if (indexByKey.has(key)) {
      merged[indexByKey.get(key)] = mapping;
    } else {
      indexByKey.set(key, merged.length);
      merged.push(mapping);
    }
  }

  return merged;
}

function buildImportPayload(importMode, importedData) {
  if (importMode === 'overwrite') {
    return {
      config: importedData.config,
      mappings: importedData.mappings,
    };
  }

  const currentConfig = getConfigPayload();
  const currentMappings = collectMappingsFromUi();

  return {
    config: mergeBridgeConfig(currentConfig, importedData.config),
    mappings: mergeMappingsByKey(currentMappings, importedData.mappings),
  };
}

function getBackupPayload() {
  return {
    backupType: 'connectmes-opcua-bridge',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      config: sanitizeConfigForBackup(getConfigPayload()),
      mappings: collectMappingsFromUi(),
    },
  };
}

function buildBackupFileName() {
  const stamp = new Date().toISOString().replaceAll(':', '-').split('.')[0];
  return `connectmes-opcua-bridge-backup-${stamp}.json`;
}

function downloadBackupFile(payload) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = buildBackupFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function normalizeBackupImport(raw) {
  if (!raw || typeof raw !== 'object') return null;

  if (raw.data && typeof raw.data === 'object') {
    const data = raw.data;
    if (data.config && Array.isArray(data.mappings)) {
      return { config: sanitizeConfigForBackup(data.config), mappings: data.mappings };
    }
  }

  if (raw.config && Array.isArray(raw.mappings)) {
    return { config: sanitizeConfigForBackup(raw.config), mappings: raw.mappings };
  }

  return null;
}

async function readBackupDraftFromFile(file) {
  const rawText = await file.text();
  const parsed = JSON.parse(rawText);
  const normalized = normalizeBackupImport(parsed);
  if (!normalized) {
    throw new Error(t('backup.invalidFormat'));
  }
  return normalized;
}

async function importBackupFromDraft(normalized, importMode = 'overwrite') {
  if (!normalized) {
    throw new Error(t('backup.invalidFormat'));
  }

  const payload = buildImportPayload(importMode, normalized);

  await apiFetch('/api/config', {
    method: 'PUT',
    body: JSON.stringify(payload.config),
  });

  await apiFetch('/api/mappings', {
    method: 'PUT',
    body: JSON.stringify(payload.mappings),
  });

  await loadAll();
}

function setLanguage(nextLang) {
  const normalized = SUPPORTED_LANGS.includes(nextLang) ? nextLang : 'es';
  appState.lang = normalized;
  document.documentElement.lang = normalized;
  localStorage.setItem(UI_LANG_KEY, normalized);
  applyTranslations();
}

function cycleLanguage() {
  const nextLang = appState.lang === 'es' ? 'en' : 'es';
  setLanguage(nextLang);
}

function getCurrentTheme() {
  const stored = String(localStorage.getItem(UI_THEME_KEY) || '').trim().toLowerCase();
  if (stored === 'dark' || stored === 'light') return stored;
  return 'light';
}

function setTheme(nextTheme) {
  const normalized = nextTheme === 'dark' ? 'dark' : 'light';
  appState.theme = normalized;
  document.body.setAttribute('data-theme', normalized);
  localStorage.setItem(UI_THEME_KEY, normalized);
  applyTranslations();
}

function toggleTheme() {
  setTheme(appState.theme === 'dark' ? 'light' : 'dark');
}

function getStoredToken() {
  return String(localStorage.getItem(AUTH_TOKEN_KEY) || '').trim();
}

function setStoredToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, String(token || '').trim());
}

function clearStoredToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function showLoginView() {
  loginShell.classList.remove('hidden');
  appShell.classList.add('hidden');
}

function showAppView() {
  appShell.classList.remove('hidden');
  loginShell.classList.add('hidden');
}

function resolveRoleLabel(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const found = roles.find((role) => String(role).trim().toLowerCase() === 'optimotion');
  return found || roles[0] || 'Optimotion';
}

function renderUserIdentity(user) {
  const username = user?.username || '-';
  const roleLabel = resolveRoleLabel(user);
  navUsernameLabel.textContent = username;
  navRoleLabel.textContent = roleLabel;
  heroRoleLabel.textContent = roleLabel;
}

function clearLocalSession() {
  clearStoredToken();
  appState.user = null;
  renderUserIdentity(null);
}

async function apiFetch(url, options = {}) {
  const { skipAuth = false, ...fetchOptions } = options;
  const isFormDataBody = fetchOptions.body instanceof FormData;
  const headers = {
    ...(fetchOptions.headers || {}),
  };

  if (!isFormDataBody && !Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth && !headers.Authorization) {
    const token = getStoredToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.ok === false) {
    if (!skipAuth && (res.status === 401 || res.status === 403)) {
      clearLocalSession();
      showLoginView();
      if (loginErrorBox) {
        loginErrorBox.textContent = t('login.sessionExpired');
      }
    }
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return body;
}

function normalizeSearchText(value) {
  return String(value || '').trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setSelectValueWithFallback(selectEl, preferredValue, fallbackValue = '') {
  if (!selectEl) return;
  const wanted = String(preferredValue ?? '').trim();
  const hasWanted = wanted && [...selectEl.options].some((option) => option.value === wanted);

  if (hasWanted) {
    selectEl.value = wanted;
    return;
  }

  const fallback = String(fallbackValue ?? '').trim();
  const hasFallback = fallback && [...selectEl.options].some((option) => option.value === fallback);
  selectEl.value = hasFallback ? fallback : (selectEl.options[0]?.value || '');
}

function getStationFacilityValue(station) {
  if (!station) return '';
  return String(station.facilitiesID ?? station.facilityId ?? station.facilityID ?? '').trim();
}

function getStationAreaValue(station) {
  if (!station) return '';
  return String(station.Area ?? station.AreaID ?? station.area ?? station.areaId ?? '').trim();
}

function getStationLineValue(station) {
  if (!station) return '';
  return String(station.Line ?? station.LineID ?? station.line ?? station.lineId ?? '').trim();
}

function normalizeOpcAuthType(rawAuthType, username = '') {
  const normalized = String(rawAuthType || '').trim().toLowerCase();
  if (normalized === 'anonymous' || normalized === 'username' || normalized === 'certificate') {
    return normalized;
  }
  return username ? 'username' : 'anonymous';
}

function normalizeOpcServer(server = {}, idx = 0) {
  const username = String(server.username || '').trim();
  const authType = normalizeOpcAuthType(server.authType, username);

  return {
    id: String(server.id || `opc-${idx + 1}`),
    name: String(server.name || `OPC Server ${idx + 1}`),
    endpoint: String(server.endpoint || ''),
    enabled: server.enabled !== false,
    securityMode: String(server.securityMode || 'None'),
    securityPolicy: String(server.securityPolicy || 'None'),
    authType,
    username,
    password: String(server.password || ''),
    userCertificateFile: String(server.userCertificateFile || ''),
    userPrivateKeyFile: String(server.userPrivateKeyFile || ''),
    userCertificateRef: String(server.userCertificateRef || ''),
    userPrivateKeyRef: String(server.userPrivateKeyRef || ''),
  };
}

function sanitizeOpcServerForBackup(server = {}, idx = 0) {
  const normalized = normalizeOpcServer(server, idx);
  return {
    ...normalized,
    userCertificateRef: '',
    userPrivateKeyRef: '',
  };
}

function getOpcServersFromConfig(config = appState.config) {
  const servers = Array.isArray(config?.opcua?.servers) ? config.opcua.servers : [];
  return servers.map((server, idx) => normalizeOpcServer(server, idx));
}

function getDefaultOpcServerId(config = appState.config) {
  const servers = getOpcServersFromConfig(config);
  const configured = String(config?.opcua?.defaultServerId || '').trim();
  if (configured && servers.some((srv) => srv.id === configured)) return configured;
  return servers[0]?.id || '';
}

function setActiveTab(tabName) {
  const tabs = [...document.querySelectorAll('.tab-btn')];
  const panels = [...document.querySelectorAll('.tab-panel')];

  tabs.forEach((btn) => btn.classList.toggle('active', btn.dataset.tabTarget === tabName));
  panels.forEach((panel) => panel.classList.toggle('active', panel.dataset.tab === tabName));
}

function initTabs() {
  const tabs = [...document.querySelectorAll('.tab-btn')];
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tabTarget));
  });
}

function fillConfigForm(config) {
  cfgFields.mqttUrl.value = config?.mqtt?.url || '';
  cfgFields.mqttUsername.value = config?.mqtt?.username || '';
  cfgFields.mqttPassword.value = config?.mqtt?.password || '';
  cfgFields.mqttClientId.value = config?.mqtt?.clientId || '';
  cfgFields.mqttQos.value = String(config?.mqtt?.qos ?? 1);
  cfgFields.mqttRetain.checked = Boolean(config?.mqtt?.retain);
  cfgFields.topicOee.value = config?.topics?.oee || 'optimotion/oee';
  cfgFields.topicEstop.value = config?.topics?.estop || 'optimotion/estop';
  cfgFields.pollInterval.value = String(config?.app?.pollIntervalMs ?? 1000);

  cfgFields.connectmesBaseUrl.value = config?.connectmes?.baseUrl || '';
  cfgFields.connectmesStationsPath.value = config?.connectmes?.stationsPath || '/api/stations/assignment/stations';
  cfgFields.connectmesToken.value = config?.connectmes?.token || '';
}

function getConfigPayload() {
  return {
    mqtt: {
      url: cfgFields.mqttUrl.value.trim(),
      username: cfgFields.mqttUsername.value.trim(),
      password: cfgFields.mqttPassword.value,
      clientId: cfgFields.mqttClientId.value.trim(),
      qos: Number.parseInt(cfgFields.mqttQos.value || '1', 10),
      retain: cfgFields.mqttRetain.checked,
    },
    topics: {
      oee: cfgFields.topicOee.value.trim(),
      estop: cfgFields.topicEstop.value.trim(),
    },
    app: {
      pollIntervalMs: Number.parseInt(cfgFields.pollInterval.value || '1000', 10),
    },
    connectmes: {
      baseUrl: cfgFields.connectmesBaseUrl.value.trim(),
      stationsPath: cfgFields.connectmesStationsPath.value.trim(),
      token: cfgFields.connectmesToken.value,
    },
    opcua: collectOpcServersPayload(),
  };
}

function buildStationLabel(station) {
  const site = station.facilitiesID ?? t('common.na');
  const zone = station.Area || station.AreaID || t('common.na');
  const cell = station.Line || station.LineID || t('common.na');
  const compactContext = tf('station.contextCompact', {
    site: String(site),
    zone: String(zone),
    cell: String(cell),
  });
  return `${station.ID} - ${station.name} (${compactContext})`;
}

function renderOpcServerDefaultSelect() {
  const servers = getOpcServersFromConfig();
  const defaultServerId = getDefaultOpcServerId();

  opcDefaultServerSelect.innerHTML = servers
    .map((server) => `<option value="${escapeHtml(server.id)}">${escapeHtml(server.name)} (${escapeHtml(server.id)})</option>`)
    .join('');

  if (defaultServerId) {
    opcDefaultServerSelect.value = defaultServerId;
  }

  browserServerSelect.innerHTML = opcDefaultServerSelect.innerHTML;
  browserState.selectedServerId = defaultServerId;
  browserServerSelect.value = defaultServerId;
}

function renderOpcServers(servers) {
  opcServersList.innerHTML = '';

  for (const [idx, rawServer] of servers.entries()) {
    const server = normalizeOpcServer(rawServer, idx);
    const fragment = opcServerTemplate.content.cloneNode(true);
    const card = fragment.querySelector('.opc-server-item');

    card.querySelector('[data-field="serverId"]').value = server.id || '';
    card.querySelector('[data-field="serverName"]').value = server.name || '';
    card.querySelector('[data-field="serverEndpoint"]').value = server.endpoint || '';
    card.querySelector('[data-field="serverEnabled"]').checked = server.enabled !== false;
    setSelectValueWithFallback(card.querySelector('[data-field="serverSecurityMode"]'), server.securityMode, 'None');
    setSelectValueWithFallback(card.querySelector('[data-field="serverSecurityPolicy"]'), server.securityPolicy, 'None');
    setSelectValueWithFallback(
      card.querySelector('[data-field="serverAuthType"]'),
      normalizeOpcAuthType(server.authType, server.username || ''),
      'anonymous'
    );
    card.querySelector('[data-field="serverUsername"]').value = server.username || '';
    card.querySelector('[data-field="serverPassword"]').value = server.password || '';
    card.querySelector('[data-field="serverUserCertificateFile"]').value = server.userCertificateFile || '';
    card.querySelector('[data-field="serverUserPrivateKeyFile"]').value = server.userPrivateKeyFile || '';
    card.querySelector('[data-field="serverUserCertificateRef"]').value = server.userCertificateRef || '';
    card.querySelector('[data-field="serverUserPrivateKeyRef"]').value = server.userPrivateKeyRef || '';

    updateOpcAuthScope(card);

    card.querySelector('[data-action="remove-opc-server"]').addEventListener('click', () => {
      card.remove();
      renderOpcServerDefaultSelectFromDom();
      renderMappings(appState.mappings);
    });

    card.querySelector('[data-field="serverId"]').addEventListener('input', () => {
      renderOpcServerDefaultSelectFromDom();
      renderMappings(appState.mappings);
    });

    card.querySelector('[data-field="serverName"]').addEventListener('input', () => {
      renderOpcServerDefaultSelectFromDom();
      renderMappings(appState.mappings);
    });

    card.querySelector('[data-field="serverAuthType"]').addEventListener('change', () => {
      updateOpcAuthScope(card, { clearHiddenValues: true });
    });

    const uploadButton = card.querySelector('[data-action="upload-opc-certificate"]');
    const certInput = card.querySelector('[data-field="uploadCertificateFile"]');
    const keyInput = card.querySelector('[data-field="uploadPrivateKeyFile"]');

    if (certInput && keyInput) {
      certInput.addEventListener('change', () => updateUploadFileSummary(card));
      keyInput.addEventListener('change', () => updateUploadFileSummary(card));
    }

    if (uploadButton) {
      uploadButton.addEventListener('click', async () => {
        try {
          setUploadStatus(card, 'Subiendo certificados...', 'saving');
          uploadButton.disabled = true;
          await uploadOpcCertificateForCard(card);
          setUploadStatus(card, 'Certificados subidos correctamente', 'success');
        } catch (error) {
          setUploadStatus(card, error.message || 'No se pudo subir', 'error');
          showMessage(error.message, true);
        } finally {
          uploadButton.disabled = false;
        }
      });
    }

    const deleteButton = card.querySelector('[data-action="delete-opc-certificate"]');
    if (deleteButton) {
      deleteButton.addEventListener('click', async () => {
        try {
          setUploadStatus(card, 'Eliminando certificados...', 'warning');
          deleteButton.disabled = true;
          await deleteUploadedOpcCertificateForCard(card);
          setUploadStatus(card, 'Certificados eliminados', 'success');
        } catch (error) {
          setUploadStatus(card, error.message || 'No se pudo eliminar', 'error');
          showMessage(error.message, true);
        } finally {
          deleteButton.disabled = false;
        }
      });
    }

    initCollapsibleCard(card, 'opc', true);

    opcServersList.appendChild(card);
  }

  renderOpcServerDefaultSelect();
}

function updateOpcAuthScope(card, options = {}) {
  const clearHiddenValues = Boolean(options.clearHiddenValues);
  const authType = normalizeOpcAuthType(card.querySelector('[data-field="serverAuthType"]').value);
  const usernameScopes = [...card.querySelectorAll('[data-auth-scope="username"]')];
  const certificateScopes = [...card.querySelectorAll('[data-auth-scope="certificate"]')];

  const clearScopeFields = (scopeEls) => {
    for (const scopeEl of scopeEls) {
      scopeEl.querySelectorAll('input, select, textarea').forEach((el) => {
        if (el instanceof HTMLInputElement) {
          if (el.type === 'checkbox' || el.type === 'radio') {
            el.checked = false;
          } else if (el.type === 'file') {
            el.value = '';
          } else {
            el.value = '';
          }
        } else if (el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
          el.value = '';
        }
      });
    }
  };

  const toggleScopes = (scopeEls, isVisible, shouldClearOnHide) => {
    for (const scopeEl of scopeEls) {
      scopeEl.hidden = !isVisible;
      scopeEl.querySelectorAll('input, select, button').forEach((el) => {
        el.disabled = !isVisible;
      });
    }

    if (clearHiddenValues && !isVisible && shouldClearOnHide) {
      clearScopeFields(scopeEls);
    }
  };

  toggleScopes(usernameScopes, authType === 'username', true);
  toggleScopes(certificateScopes, authType === 'certificate', true);
}

function collectOpcServersFromDom() {
  const cards = [...opcServersList.querySelectorAll('.opc-server-item')];
  return cards.map((card, idx) => {
    const username = card.querySelector('[data-field="serverUsername"]').value.trim();

    return normalizeOpcServer({
      id: card.querySelector('[data-field="serverId"]').value.trim() || `opc-${idx + 1}`,
      name: card.querySelector('[data-field="serverName"]').value.trim() || `OPC Server ${idx + 1}`,
      endpoint: card.querySelector('[data-field="serverEndpoint"]').value.trim(),
      enabled: card.querySelector('[data-field="serverEnabled"]').checked,
      securityMode: card.querySelector('[data-field="serverSecurityMode"]').value.trim() || 'None',
      securityPolicy: card.querySelector('[data-field="serverSecurityPolicy"]').value.trim() || 'None',
      authType: card.querySelector('[data-field="serverAuthType"]').value.trim(),
      username,
      password: card.querySelector('[data-field="serverPassword"]').value,
      userCertificateFile: card.querySelector('[data-field="serverUserCertificateFile"]').value.trim(),
      userPrivateKeyFile: card.querySelector('[data-field="serverUserPrivateKeyFile"]').value.trim(),
      userCertificateRef: card.querySelector('[data-field="serverUserCertificateRef"]').value.trim(),
      userPrivateKeyRef: card.querySelector('[data-field="serverUserPrivateKeyRef"]').value.trim(),
    }, idx);
  });
}

async function uploadOpcCertificateForCard(card) {
  const serverIdInput = card.querySelector('[data-field="serverId"]');
  const certInput = card.querySelector('[data-field="uploadCertificateFile"]');
  const keyInput = card.querySelector('[data-field="uploadPrivateKeyFile"]');

  const serverId = String(serverIdInput?.value || '').trim();
  if (!serverId) {
    throw new Error(t('opc.uploadNeedServerId'));
  }

  const certificateFile = certInput?.files?.[0] || null;
  const privateKeyFile = keyInput?.files?.[0] || null;
  if (!certificateFile || !privateKeyFile) {
    throw new Error(t('opc.uploadNeedFiles'));
  }

  const formData = new FormData();
  formData.append('serverId', serverId);
  formData.append('certificate', certificateFile);
  formData.append('privateKey', privateKeyFile);

  const response = await apiFetch('/api/opc/certificates/upload', {
    method: 'POST',
    body: formData,
  });

  const certRefInput = card.querySelector('[data-field="serverUserCertificateRef"]');
  const keyRefInput = card.querySelector('[data-field="serverUserPrivateKeyRef"]');
  if (certRefInput) certRefInput.value = response.certificateRef || '';
  if (keyRefInput) keyRefInput.value = response.privateKeyRef || '';

  showMessage(tf('opc.uploadDone', { serverId: response.serverId || serverId }));
}

async function deleteUploadedOpcCertificateForCard(card) {
  const serverIdInput = card.querySelector('[data-field="serverId"]');
  const certRefInput = card.querySelector('[data-field="serverUserCertificateRef"]');
  const keyRefInput = card.querySelector('[data-field="serverUserPrivateKeyRef"]');
  const certUploadInput = card.querySelector('[data-field="uploadCertificateFile"]');
  const keyUploadInput = card.querySelector('[data-field="uploadPrivateKeyFile"]');

  const serverId = String(serverIdInput?.value || '').trim();
  if (!serverId) {
    throw new Error(t('opc.deleteNeedServerId'));
  }

  await apiFetch(`/api/opc/certificates/${encodeURIComponent(serverId)}`, {
    method: 'DELETE',
  });

  if (certRefInput) certRefInput.value = '';
  if (keyRefInput) keyRefInput.value = '';
  if (certUploadInput) certUploadInput.value = '';
  if (keyUploadInput) keyUploadInput.value = '';

  showMessage(tf('opc.deleteDone', { serverId }));
}

function renderOpcServerDefaultSelectFromDom() {
  const servers = collectOpcServersFromDom();
  const current = opcDefaultServerSelect.value;

  opcDefaultServerSelect.innerHTML = servers
    .map((server) => `<option value="${escapeHtml(server.id)}">${escapeHtml(server.name)} (${escapeHtml(server.id)})</option>`)
    .join('');

  if (servers.some((srv) => srv.id === current)) {
    opcDefaultServerSelect.value = current;
  }

  browserServerSelect.innerHTML = opcDefaultServerSelect.innerHTML;
  browserServerSelect.value = opcDefaultServerSelect.value;
  browserState.selectedServerId = browserServerSelect.value;
}

function collectOpcServersPayload() {
  const servers = collectOpcServersFromDom();
  const defaultServerId = opcDefaultServerSelect.value || servers[0]?.id || '';
  return { defaultServerId, servers };
}

async function loadConnectMesStations() {
  const result = await apiFetch('/api/connectmes/stations');
  appState.stations = Array.isArray(result.stations) ? result.stations : [];
  appState.stationsById = new Map(appState.stations.map((st) => [String(st.ID), st]));
}

function buildStationHierarchy() {
  const facilities = new Map();
  const areasByFacility = new Map();
  const linesByFacilityArea = new Map();

  for (const station of appState.stations) {
    const facility = getStationFacilityValue(station);
    const area = getStationAreaValue(station);
    const line = getStationLineValue(station);

    if (facility && !facilities.has(facility)) facilities.set(facility, facility);

    if (facility && area) {
      const areas = areasByFacility.get(facility) || new Set();
      areas.add(area);
      areasByFacility.set(facility, areas);
    }

    if (facility && area && line) {
      const key = `${facility}|${area}`;
      const lines = linesByFacilityArea.get(key) || new Set();
      lines.add(line);
      linesByFacilityArea.set(key, lines);
    }
  }

  return { facilities, areasByFacility, linesByFacilityArea };
}

function fillSelectOptions(selectEl, values, placeholderKey) {
  const sortedValues = [...values].map((value) => String(value)).sort((a, b) => a.localeCompare(b));
  const options = [`<option value="">${escapeHtml(t(placeholderKey))}</option>`];
  for (const value of sortedValues) {
    options.push(`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`);
  }
  selectEl.innerHTML = options.join('');
}

function populateFacilitySelect(selectEl, selectedFacility = '') {
  const hierarchy = buildStationHierarchy();
  fillSelectOptions(selectEl, hierarchy.facilities.keys(), 'mappings.selectFacility');
  setSelectValueWithFallback(selectEl, selectedFacility, '');
}

function populateAreaSelect(selectEl, facilityValue = '', selectedArea = '') {
  const hierarchy = buildStationHierarchy();
  const areas = hierarchy.areasByFacility.get(String(facilityValue || '')) || new Set();
  fillSelectOptions(selectEl, areas.values(), 'mappings.selectArea');
  setSelectValueWithFallback(selectEl, selectedArea, '');
}

function populateLineSelect(selectEl, facilityValue = '', areaValue = '', selectedLine = '') {
  const hierarchy = buildStationHierarchy();
  const lines = hierarchy.linesByFacilityArea.get(`${facilityValue}|${areaValue}`) || new Set();
  fillSelectOptions(selectEl, lines.values(), 'mappings.selectLine');
  setSelectValueWithFallback(selectEl, selectedLine, '');
}

function getFilteredStations({ facility = '', area = '', line = '' } = {}) {
  return appState.stations.filter((station) => {
    if (facility && getStationFacilityValue(station) !== String(facility)) return false;
    if (area && getStationAreaValue(station) !== String(area)) return false;
    if (line && getStationLineValue(station) !== String(line)) return false;
    return true;
  });
}

function populateStationSelect(selectEl, selectedId = '', filters = {}) {
  const stations = getFilteredStations(filters);
  const options = [`<option value="">${escapeHtml(t('mappings.selectStation'))}</option>`];
  for (const station of stations) {
    options.push(`<option value="${escapeHtml(station.ID)}">${escapeHtml(buildStationLabel(station))}</option>`);
  }

  selectEl.innerHTML = options.join('');
  setSelectValueWithFallback(selectEl, selectedId, '');
}

function populateOpcServerSelect(selectEl, selectedId = '') {
  const servers = getOpcServersFromConfig();
  const options = servers.map((server) => `<option value="${escapeHtml(server.id)}">${escapeHtml(server.name)} (${escapeHtml(server.id)})</option>`);
  selectEl.innerHTML = options.join('');

  const fallback = getDefaultOpcServerId();
  selectEl.value = selectedId && servers.some((srv) => srv.id === selectedId)
    ? selectedId
    : fallback;
}

function syncContextFromStation(row) {
  const facilitySelect = row.querySelector('[data-field="facilityId"]');
  const areaSelect = row.querySelector('[data-field="areaId"]');
  const lineSelect = row.querySelector('[data-field="lineId"]');
  const stationSelect = row.querySelector('[data-field="stationId"]');
  const station = appState.stationsById.get(String(stationSelect.value || ''));

  if (station) {
    const facility = getStationFacilityValue(station);
    const area = getStationAreaValue(station);
    const line = getStationLineValue(station);

    setSelectValueWithFallback(facilitySelect, facility, '');
    populateAreaSelect(areaSelect, facility, area);
    populateLineSelect(lineSelect, facility, area, line);
  }

  const facilityValue = station ? getStationFacilityValue(station) : String(facilitySelect?.value || '');
  const areaValue = station ? getStationAreaValue(station) : String(areaSelect?.value || '');
  const lineValue = station ? getStationLineValue(station) : String(lineSelect?.value || '');

  row.dataset.facilities = facilityValue;
  row.dataset.area = areaValue;
  row.dataset.line = lineValue;

  const title = row.querySelector('[data-field="station-title"]');
  title.textContent = station ? `${station.ID} - ${station.name}` : t('common.na');
}

const FUNCTIONALITY_TYPES = [
  {
    id: 'pieceCount',
    nameKey: 'mappings.functionalityPieceCount',
    defaultTopic: 'optimotion/oee',
    defaultEnabled: true,
    defaultOnlyOnChange: false,
    defaultTrigger: { mode: 'always', triggerNodeId: '', intervalSeconds: 0 },
  },
  {
    id: 'machineStates',
    nameKey: 'mappings.functionalityMachineStates',
    defaultTopic: 'optimotion/estop',
    defaultEnabled: false,
    defaultOnlyOnChange: true,
    defaultTrigger: { mode: 'onValueChanged', triggerNodeId: '', intervalSeconds: 0 },
  },
  {
    id: 'custom',
    nameKey: 'mappings.functionalityCustom',
    defaultTopic: '',
    defaultEnabled: false,
    defaultOnlyOnChange: false,
    defaultTrigger: { mode: 'always', triggerNodeId: '', intervalSeconds: 0 },
  },
];

function getFunctionalityTypeById(typeId = '') {
  return FUNCTIONALITY_TYPES.find((item) => item.id === typeId) || FUNCTIONALITY_TYPES[2];
}

function getSignalsForFunctionalityType(typeId = 'custom') {
  return SIGNAL_DEFINITIONS_BY_TYPE[typeId] || [];
}

function normalizeFunctionalityNodes(typeId = 'custom', rawNodes = {}, legacyNodes = {}) {
  const nodes = {};
  const signalDefs = getSignalsForFunctionalityType(typeId);

  for (const signal of signalDefs) {
    const rawValue = rawNodes?.[signal.key] ?? legacyNodes?.[signal.key] ?? '';
    const value = String(rawValue || '').trim();
    if (value) nodes[signal.key] = value;
  }

  return nodes;
}

function normalizeTriggerEvent(input = {}, fallbackMode = 'always') {
  const mode = ['always', 'onValueChanged', 'intervalSeconds'].includes(input.mode)
    ? input.mode
    : fallbackMode;

  return {
    mode,
    triggerNodeId: String(input.triggerNodeId || '').trim(),
    intervalSeconds: Number.parseInt(String(input.intervalSeconds || '0'), 10) || 0,
  };
}

function normalizeFunctionalitiesFromMapping(mapping = {}) {
  const legacyNodes = mapping.nodes || {};

  if (Array.isArray(mapping.functionalities) && mapping.functionalities.length > 0) {
    return mapping.functionalities.map((raw) => {
      const type = getFunctionalityTypeById(raw.type || raw.id || 'custom');
      const triggers = Array.isArray(raw.triggers) && raw.triggers.length > 0
        ? raw.triggers.map((event) => normalizeTriggerEvent(event, type.defaultTrigger.mode))
        : [normalizeTriggerEvent(type.defaultTrigger, type.defaultTrigger.mode)];

      return {
        id: String(raw.id || type.id || `fn-${Math.random().toString(36).slice(2, 8)}`),
        name: String(raw.name || t(type.nameKey)),
        type: type.id,
        enabled: Boolean(raw.enabled),
        onlyOnChange: Boolean(raw.onlyOnChange),
        topic: String(raw.topic || ''),
        triggers,
        nodes: normalizeFunctionalityNodes(type.id, raw.nodes || {}, legacyNodes),
      };
    });
  }

  const legacyOee = mapping.triggers?.oee || {};
  const legacyEstop = mapping.triggers?.estop || {};
  return [
    {
      id: 'pieceCount',
      name: t('mappings.functionalityPieceCount'),
      type: 'pieceCount',
      enabled: mapping.publish?.oee !== false,
      onlyOnChange: Boolean(mapping.publish?.oeeOnlyOnChange),
      topic: String(mapping.topics?.oee || ''),
      triggers: [normalizeTriggerEvent({
        mode: legacyOee.mode || 'always',
        triggerNodeId: legacyOee.triggerNodeId || '',
        intervalSeconds: legacyOee.intervalSeconds || 0,
      }, 'always')],
      nodes: normalizeFunctionalityNodes('pieceCount', {}, legacyNodes),
    },
    {
      id: 'machineStates',
      name: t('mappings.functionalityMachineStates'),
      type: 'machineStates',
      enabled: Boolean(mapping.publish?.estop),
      onlyOnChange: mapping.publish?.estopOnlyOnChange !== false,
      topic: String(mapping.topics?.estop || ''),
      triggers: [normalizeTriggerEvent({
        mode: legacyEstop.mode || 'onValueChanged',
        triggerNodeId: legacyEstop.triggerNodeId || '',
        intervalSeconds: legacyEstop.intervalSeconds || 0,
      }, 'onValueChanged')],
      nodes: normalizeFunctionalityNodes('machineStates', {}, legacyNodes),
    },
  ];
}

function functionalityTypeOptionsHtml(selectedType = 'custom', row = null, currentFeatureNode = null) {
  const usedTypes = new Set();
  if (row) {
    for (const featureNode of row.querySelectorAll('.mapping-functionality-card')) {
      if (currentFeatureNode && featureNode === currentFeatureNode) continue;
      const value = String(featureNode.querySelector('[data-functionality-field="type"]')?.value || '').trim();
      if (value) usedTypes.add(value);
    }
  }

  return FUNCTIONALITY_TYPES
    .map((type) => {
      const isSelected = type.id === selectedType;
      const isDuplicatedPredefined = type.id !== 'custom' && usedTypes.has(type.id) && !isSelected;
      return `<option value="${escapeHtml(type.id)}" ${isSelected ? 'selected' : ''} ${isDuplicatedPredefined ? 'disabled' : ''}>${escapeHtml(t(type.nameKey))}</option>`;
    })
    .join('');
}

function renderFunctionalitySignals(featureNode, feature = {}) {
  const signalsList = featureNode.querySelector('[data-functionality-field="signals-list"]');
  if (!signalsList) return;

  const typeId = String(featureNode.querySelector('[data-functionality-field="type"]')?.value || feature.type || 'custom');
  const signalDefs = getSignalsForFunctionalityType(typeId);
  const currentNodes = feature.nodes || {};

  if (typeId === 'custom') {
    const customEntries = Object.entries(currentNodes || {});
    const rows = customEntries.length > 0
      ? customEntries
      : [['', '']];

    const rowsHtml = rows.map(([name, nodeId]) => `
      <div class="grid four custom-signal-row" data-custom-signal-row="true">
        <label><span data-i18n="mappings.functionalityName">Nombre funcionalidad</span>
          <input data-custom-signal-name="true" type="text" value="${escapeHtml(String(name || ''))}" placeholder="field_name" />
        </label>
        <label><span data-i18n="mappings.triggerProperty">Propiedad para cambio de valor</span>
          <span class="input-picker"><input data-custom-signal-nodeid="true" type="text" value="${escapeHtml(String(nodeId || ''))}" placeholder="ns=3;s=Device.Custom01" /><button class="btn btn-secondary btn-pick-node" type="button">🔎</button></span>
        </label>
        <div class="actions align-end">
          <button class="btn btn-danger" type="button" data-action="remove-custom-signal" data-i18n="mappings.removeTrigger">Eliminar evento</button>
        </div>
      </div>
    `).join('');

    signalsList.innerHTML = `
      <div data-functionality-field="custom-signals-list">${rowsHtml}</div>
      <div class="actions">
        <button class="btn btn-secondary" type="button" data-action="add-custom-signal" data-i18n="mappings.addTriggerEvent">Agregar evento</button>
      </div>
    `;

    applyTranslationsInRoot(signalsList);
    return;
  }

  if (signalDefs.length === 0) {
    signalsList.innerHTML = `<p class="muted" data-i18n="mappings.noSignalsForType">${escapeHtml(t('mappings.noSignalsForType'))}</p>`;
    applyTranslationsInRoot(signalsList);
    return;
  }

  const rows = signalDefs.map((signal) => {
    const value = String(currentNodes[signal.key] || '').trim();
    return `
      <label><span data-i18n="${escapeHtml(signal.labelKey)}">${escapeHtml(t(signal.labelKey))}</span>
        <span class="input-picker"><input data-function-node="${escapeHtml(signal.key)}" type="text" value="${escapeHtml(value)}" placeholder="${escapeHtml(signal.placeholder || 'ns=3;s=Device.Tag01')}" /><button class="btn btn-secondary btn-pick-node" type="button">🔎</button></span>
      </label>
    `;
  }).join('');

  signalsList.innerHTML = `<div class="grid two">${rows}</div>`;
  applyTranslationsInRoot(signalsList);
}

function updateFunctionalityTypeOptions(row) {
  for (const featureNode of row.querySelectorAll('.mapping-functionality-card')) {
    const typeSelect = featureNode.querySelector('[data-functionality-field="type"]');
    if (!typeSelect) continue;
    const selected = String(typeSelect.value || 'custom');
    typeSelect.innerHTML = functionalityTypeOptionsHtml(selected, row, featureNode);
    typeSelect.value = selected;
  }
}

function getFunctionalityTopicPlaceholder(typeId = 'custom') {
  if (typeId === 'pieceCount') return 'optimotion/oee';
  if (typeId === 'machineStates') return 'optimotion/estop';
  return 'optimotion/custom';
}

function createTriggerEventNode(event = normalizeTriggerEvent(), index = 0) {
  const node = document.createElement('div');
  node.className = 'trigger-event-item is-collapsed';
  node.dataset.triggerIndex = String(index);
  node.innerHTML = `
    <div class="feature-block-head trigger-head">
      <strong>Evento ${index + 1}</strong>
      <button class="btn btn-secondary btn-mini-collapse" type="button" data-action="toggle-trigger-event" aria-expanded="false">+</button>
    </div>
    <div data-trigger-collapsible-body="true" hidden>
      <div class="grid four">
        <label><span data-i18n="mappings.triggerType">Tipo de disparo</span>
          <select data-trigger-field="mode">
            <option value="always" ${event.mode === 'always' ? 'selected' : ''} data-i18n="mappings.modeAlways">Siempre</option>
            <option value="onValueChanged" ${event.mode === 'onValueChanged' ? 'selected' : ''} data-i18n="mappings.modeOnChange">Por cambio de valor</option>
            <option value="intervalSeconds" ${event.mode === 'intervalSeconds' ? 'selected' : ''} data-i18n="mappings.modeInterval">Cada X segundos</option>
          </select>
        </label>
        <label data-trigger-scope="onValueChanged"><span data-i18n="mappings.triggerProperty">Propiedad para cambio de valor</span>
          <span class="input-picker"><input data-trigger-field="triggerNodeId" type="text" value="${escapeHtml(event.triggerNodeId || '')}" placeholder="ns=3;s=Device.Trigger01" /><button class="btn btn-secondary btn-pick-node" type="button">🔎</button></span>
        </label>
        <label data-trigger-scope="intervalSeconds"><span data-i18n="mappings.triggerSeconds">Segundos</span>
          <input data-trigger-field="intervalSeconds" type="number" min="1" step="1" value="${escapeHtml(event.intervalSeconds > 0 ? String(event.intervalSeconds) : '')}" placeholder="1" />
        </label>
        <div class="actions">
          <button class="btn btn-danger" type="button" data-action="remove-trigger-event" data-i18n="mappings.removeTrigger">Eliminar evento</button>
        </div>
      </div>
    </div>
  `;

  applyTranslationsInRoot(node);
  updateTriggerEventScope(node);
  return node;
}

function updateTriggerEventScope(triggerNode) {
  const mode = triggerNode.querySelector('[data-trigger-field="mode"]')?.value || 'always';
  const toggleScope = (selector, visible) => {
    triggerNode.querySelectorAll(selector).forEach((scopeEl) => {
      scopeEl.hidden = !visible;
      scopeEl.querySelectorAll('input, select, button').forEach((el) => {
        el.disabled = !visible;
      });
    });
  };

  toggleScope('[data-trigger-scope="onValueChanged"]', mode === 'onValueChanged');
  toggleScope('[data-trigger-scope="intervalSeconds"]', mode === 'intervalSeconds');
}

function createFunctionalityNode(feature, index = 0) {
  const node = document.createElement('section');
  node.className = 'mapping-functionality-card is-collapsed';
  node.dataset.functionalityIndex = String(index);
  node.dataset.functionalityId = String(feature.id || '');

  const typeId = getFunctionalityTypeById(feature.type || 'custom').id;
  const normalizedNodes = normalizeFunctionalityNodes(typeId, feature.nodes || {});

  node.innerHTML = `
    <div class="feature-block-head">
      <strong>${escapeHtml(feature.name || t(getFunctionalityTypeById(typeId).nameKey))}</strong>
      <button class="btn btn-secondary btn-mini-collapse" type="button" data-action="toggle-functionality" aria-expanded="false">+</button>
    </div>
    <div data-feature-collapsible-body="true" hidden>
      <div class="grid four">
        <label><span data-i18n="mappings.functionalityName">Nombre funcionalidad</span>
          <input data-functionality-field="name" type="text" value="${escapeHtml(feature.name || '')}" />
        </label>
        <label><span data-i18n="mappings.functionalityType">Tipo funcionalidad</span>
          <select data-functionality-field="type">${functionalityTypeOptionsHtml(typeId)}</select>
        </label>
        <label><span data-i18n="mappings.topicOptional">Canal / tópico (opcional)</span>
          <input data-functionality-field="topic" type="text" value="${escapeHtml(feature.topic || '')}" placeholder="${escapeHtml(getFunctionalityTopicPlaceholder(typeId))}" />
        </label>
        <label class="checkbox"><span data-i18n="mappings.enabled">Habilitada</span><input data-functionality-field="enabled" type="checkbox" ${feature.enabled ? 'checked' : ''} /></label>
      </div>
      <h5 data-i18n="mappings.functionalitySignals">Señales OPC de la funcionalidad</h5>
      <div data-functionality-field="signals-list"></div>
      <div class="grid one">
        <label class="checkbox"><span data-i18n="mappings.onlyOnChange">Solo publicar por cambio</span><input data-functionality-field="onlyOnChange" type="checkbox" ${feature.onlyOnChange ? 'checked' : ''} /></label>
      </div>
      <h5 data-i18n="mappings.triggerEvents">Eventos de disparo</h5>
      <div data-functionality-field="triggers-list"></div>
      <div class="actions">
        <button class="btn btn-secondary" type="button" data-action="add-trigger-event" data-i18n="mappings.addTriggerEvent">Agregar evento</button>
        <button class="btn btn-danger" type="button" data-action="remove-functionality" data-i18n="mappings.removeFunctionality">Eliminar funcionalidad</button>
      </div>
    </div>
  `;

  const triggersList = node.querySelector('[data-functionality-field="triggers-list"]');
  const triggerEvents = Array.isArray(feature.triggers) && feature.triggers.length > 0
    ? feature.triggers
    : [normalizeTriggerEvent({ mode: 'always' })];

  triggerEvents.forEach((event, triggerIndex) => {
    triggersList.appendChild(createTriggerEventNode(event, triggerIndex));
  });

  renderFunctionalitySignals(node, { ...feature, type: typeId, nodes: normalizedNodes });
  applyTranslationsInRoot(node);
  return node;
}

function createDefaultFunctionality(typeId = 'custom') {
  const type = getFunctionalityTypeById(typeId);
  return {
    id: `${type.id}-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    name: t(type.nameKey),
    type: type.id,
    enabled: type.defaultEnabled,
    onlyOnChange: type.defaultOnlyOnChange,
    topic: type.defaultTopic,
    triggers: [normalizeTriggerEvent(type.defaultTrigger, type.defaultTrigger.mode)],
    nodes: normalizeFunctionalityNodes(type.id, {}),
  };
}

function renderFunctionalitiesInRow(row, mapping = null) {
  const featuresList = row.querySelector('[data-field="functionalities-list"]');
  featuresList.innerHTML = '';

  const features = normalizeFunctionalitiesFromMapping(mapping || {});
  for (const [index, feature] of features.entries()) {
    featuresList.appendChild(createFunctionalityNode(feature, index));
  }

  updateFunctionalityTypeOptions(row);
}

function addFunctionalityToRow(row, typeId = 'custom') {
  const featuresList = row.querySelector('[data-field="functionalities-list"]');
  const selectedTypes = new Set(
    [...row.querySelectorAll('.mapping-functionality-card [data-functionality-field="type"]')]
      .map((select) => String(select.value || '').trim())
      .filter(Boolean)
  );

  let candidateType = typeId;
  if (candidateType !== 'custom' && selectedTypes.has(candidateType)) {
    const availablePredefined = FUNCTIONALITY_TYPES
      .map((item) => item.id)
      .filter((id) => id !== 'custom' && !selectedTypes.has(id));
    candidateType = availablePredefined[0] || 'custom';
  }

  featuresList.appendChild(createFunctionalityNode(createDefaultFunctionality(candidateType), featuresList.children.length));
  updateFunctionalityTypeOptions(row);
}

function addTriggerEventToFunctionality(featureNode) {
  const triggersList = featureNode.querySelector('[data-functionality-field="triggers-list"]');
  triggersList.appendChild(createTriggerEventNode(normalizeTriggerEvent({ mode: 'always' }), triggersList.children.length));
}

function addCustomSignalRow(featureNode) {
  const container = featureNode.querySelector('[data-functionality-field="custom-signals-list"]');
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'grid four custom-signal-row';
  wrapper.setAttribute('data-custom-signal-row', 'true');
  wrapper.innerHTML = `
    <label><span data-i18n="mappings.functionalityName">Nombre funcionalidad</span>
      <input data-custom-signal-name="true" type="text" placeholder="field_name" />
    </label>
    <label><span data-i18n="mappings.triggerProperty">Propiedad para cambio de valor</span>
      <span class="input-picker"><input data-custom-signal-nodeid="true" type="text" placeholder="ns=3;s=Device.Custom01" /><button class="btn btn-secondary btn-pick-node" type="button">🔎</button></span>
    </label>
    <div class="actions align-end">
      <button class="btn btn-danger" type="button" data-action="remove-custom-signal" data-i18n="mappings.removeTrigger">Eliminar evento</button>
    </div>
  `;

  applyTranslationsInRoot(wrapper);
  container.appendChild(wrapper);
}

function readTriggerEventsFromFunctionality(featureNode) {
  const triggerRows = [...featureNode.querySelectorAll('.trigger-event-item')];
  const events = triggerRows.map((triggerRow) => normalizeTriggerEvent({
    mode: triggerRow.querySelector('[data-trigger-field="mode"]')?.value || 'always',
    triggerNodeId: triggerRow.querySelector('[data-trigger-field="triggerNodeId"]')?.value || '',
    intervalSeconds: triggerRow.querySelector('[data-trigger-field="intervalSeconds"]')?.value || 0,
  }));

  if (events.length === 0) {
    events.push(normalizeTriggerEvent({ mode: 'always' }));
  }

  return events;
}

function collectFunctionalitiesFromRow(row) {
  const featureNodes = [...row.querySelectorAll('.mapping-functionality-card')];
  return featureNodes.map((featureNode, index) => {
    const type = getFunctionalityTypeById(featureNode.querySelector('[data-functionality-field="type"]')?.value || 'custom');
    const fallbackName = t(type.nameKey);

    const nodes = {};
    for (const input of featureNode.querySelectorAll('[data-function-node]')) {
      const key = String(input.getAttribute('data-function-node') || '').trim();
      const value = String(input.value || '').trim();
      if (key && value) nodes[key] = value;
    }

    for (const customRow of featureNode.querySelectorAll('[data-custom-signal-row="true"]')) {
      const key = String(customRow.querySelector('[data-custom-signal-name="true"]')?.value || '').trim();
      const value = String(customRow.querySelector('[data-custom-signal-nodeid="true"]')?.value || '').trim();
      if (key && value) nodes[key] = value;
    }

    return {
      id: String(featureNode.dataset.functionalityId || `${type.id}-${index + 1}`),
      name: String(featureNode.querySelector('[data-functionality-field="name"]')?.value || fallbackName).trim() || fallbackName,
      type: type.id,
      enabled: Boolean(featureNode.querySelector('[data-functionality-field="enabled"]')?.checked),
      onlyOnChange: Boolean(featureNode.querySelector('[data-functionality-field="onlyOnChange"]')?.checked),
      topic: String(featureNode.querySelector('[data-functionality-field="topic"]')?.value || '').trim(),
      triggers: readTriggerEventsFromFunctionality(featureNode),
      nodes,
    };
  });
}

function findFunctionalityByType(functionalities, typeId) {
  return functionalities.find((feature) => feature.type === typeId) || null;
}

function pickLegacyTrigger(feature, fallbackMode = 'always') {
  if (!feature || !Array.isArray(feature.triggers) || feature.triggers.length === 0) {
    return normalizeTriggerEvent({ mode: fallbackMode }, fallbackMode);
  }

  const firstSpecific = feature.triggers.find((evt) => evt.mode === 'onValueChanged' || evt.mode === 'intervalSeconds');
  return normalizeTriggerEvent(firstSpecific || feature.triggers[0], fallbackMode);
}

function buildLegacyFieldsFromFunctionalities(functionalities) {
  const pieceCount = findFunctionalityByType(functionalities, 'pieceCount');
  const machineStates = findFunctionalityByType(functionalities, 'machineStates');

  const nodes = {};
  for (const feature of functionalities || []) {
    for (const [key, value] of Object.entries(feature.nodes || {})) {
      if (!value) continue;
      nodes[key] = String(value);
    }
  }

  return {
    publish: {
      oee: pieceCount ? pieceCount.enabled : true,
      estop: machineStates ? machineStates.enabled : false,
      oeeOnlyOnChange: pieceCount ? pieceCount.onlyOnChange : false,
      estopOnlyOnChange: machineStates ? machineStates.onlyOnChange : true,
    },
    topics: {
      oee: pieceCount?.topic || '',
      estop: machineStates?.topic || '',
    },
    triggers: {
      oee: pickLegacyTrigger(pieceCount, 'always'),
      estop: pickLegacyTrigger(machineStates, 'onValueChanged'),
    },
    nodes,
  };
}

function resolveContextFromRow(row) {
  const stationId = String(row.querySelector('[data-field="stationId"]')?.value || '');
  const station = appState.stationsById.get(stationId);

  if (station) {
    return {
      facilities: getStationFacilityValue(station),
      Area: getStationAreaValue(station),
      Line: getStationLineValue(station),
    };
  }

  return {
    facilities: String(row.querySelector('[data-field="facilityId"]')?.value || row.dataset.facilities || ''),
    Area: String(row.querySelector('[data-field="areaId"]')?.value || row.dataset.area || ''),
    Line: String(row.querySelector('[data-field="lineId"]')?.value || row.dataset.line || ''),
  };
}

function setActiveTarget(input) {
  browserState.activeTargetInput = input || null;

  if (!browserState.activeTargetInput) {
    browserActiveTargetLabel.textContent = t('browser.activeNone');
    return;
  }

  const label = resolveActiveFieldLabel(browserState.activeTargetInput);
  browserActiveTargetLabel.textContent = tf('browser.activeField', { field: label });
}

function resolveActiveFieldLabel(input) {
  const fromLabel = input.closest('label')?.querySelector('[data-i18n]')?.textContent?.trim();
  if (fromLabel) return fromLabel;

  const nodeKey = input.getAttribute('data-node');
  if (nodeKey) return t(`mapping.field.${nodeKey}`);

  const fieldKey = input.getAttribute('data-field');
  if (fieldKey) {
    const byDataField = {
      facilityId: 'mappings.facility',
      areaId: 'mappings.area',
      lineId: 'mappings.line',
      stationId: 'mappings.stationConnectmes',
      opcServerId: 'mappings.opcServer',
      Resolution: 'mappings.sampleScale',
    };

    const i18nKey = byDataField[fieldKey];
    if (i18nKey) return t(i18nKey);
    return fieldKey;
  }

  const triggerField = input.getAttribute('data-trigger-field');
  if (triggerField === 'triggerNodeId') return t('mappings.triggerProperty');
  if (triggerField === 'intervalSeconds') return t('mappings.triggerSeconds');

  const featureField = input.getAttribute('data-functionality-field');
  if (featureField === 'topic') return t('mappings.topicOptional');
  if (featureField === 'name') return t('mappings.functionalityName');

  const functionNode = input.getAttribute('data-function-node');
  if (functionNode) return t(`mapping.field.${functionNode}`);

  if (input.hasAttribute('data-custom-signal-name')) return t('mappings.functionalityName');
  if (input.hasAttribute('data-custom-signal-nodeid')) return t('mappings.triggerProperty');

  return input.name || t('browser.fieldFallback');
}

function openTagBrowser(targetInput) {
  setActiveTarget(targetInput);
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');

  const row = targetInput.closest('.mapping-item');
  if (row) {
    const mappingServerSelect = row.querySelector('[data-field="opcServerId"]');
    if (mappingServerSelect?.value) {
      browserState.selectedServerId = mappingServerSelect.value;
      browserServerSelect.value = browserState.selectedServerId;
    }
  }

  browseNode(browserCurrentNodeInput.value || 'RootFolder').catch((error) => {
    showMessage(error.message, true);
  });
}

function closeTagBrowser() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function updateResolutionFromFunctionalities(row) {
  const resolutionInput = row.querySelector('[data-field="Resolution"]');
  if (!resolutionInput) return;

  const features = collectFunctionalitiesFromRow(row);
  let autoResolution = 0;
  for (const feature of features) {
    if (!feature.enabled) continue;
    const intervalEvent = feature.triggers.find((evt) => evt.mode === 'intervalSeconds' && evt.intervalSeconds > 0);
    if (intervalEvent) {
      autoResolution = intervalEvent.intervalSeconds;
      break;
    }
  }

  if (autoResolution > 0) {
    resolutionInput.value = String(autoResolution);
    resolutionInput.readOnly = true;
    resolutionInput.title = 'Auto from interval trigger';
    return;
  }

  resolutionInput.readOnly = false;
  if (!String(resolutionInput.value || '').trim()) {
    resolutionInput.value = '1';
  }
  resolutionInput.title = '';
}

function refreshStationSelectByHierarchy(row, preferredStationId = '') {
  const facility = String(row.querySelector('[data-field="facilityId"]').value || '').trim();
  const area = String(row.querySelector('[data-field="areaId"]').value || '').trim();
  const line = String(row.querySelector('[data-field="lineId"]').value || '').trim();
  const stationSelect = row.querySelector('[data-field="stationId"]');

  populateStationSelect(stationSelect, preferredStationId, { facility, area, line });
}

function createMappingNode(mapping = null) {
  const fragment = mappingTemplate.content.cloneNode(true);
  const row = fragment.querySelector('.mapping-item');

  const facilitySelect = row.querySelector('[data-field="facilityId"]');
  const areaSelect = row.querySelector('[data-field="areaId"]');
  const lineSelect = row.querySelector('[data-field="lineId"]');
  const stationSelect = row.querySelector('[data-field="stationId"]');
  const opcServerSelect = row.querySelector('[data-field="opcServerId"]');

  const selectedStation = appState.stationsById.get(String(mapping?.stationId || ''));
  const initialFacility = selectedStation
    ? getStationFacilityValue(selectedStation)
    : String(mapping?.context?.facilities || '');
  const initialArea = selectedStation
    ? getStationAreaValue(selectedStation)
    : String(mapping?.context?.Area || '');
  const initialLine = selectedStation
    ? getStationLineValue(selectedStation)
    : String(mapping?.context?.Line || '');

  populateFacilitySelect(facilitySelect, initialFacility);
  populateAreaSelect(areaSelect, initialFacility, initialArea);
  populateLineSelect(lineSelect, initialFacility, initialArea, initialLine);
  refreshStationSelectByHierarchy(row, String(mapping?.stationId || ''));
  populateOpcServerSelect(opcServerSelect, String(mapping?.opcServerId || ''));

  row.querySelector('[data-field="Resolution"]').value = String(mapping?.defaults?.Resolution ?? 1);

  renderFunctionalitiesInRow(row, mapping);

  facilitySelect.addEventListener('change', () => {
    populateAreaSelect(areaSelect, facilitySelect.value, '');
    populateLineSelect(lineSelect, facilitySelect.value, areaSelect.value, '');
    refreshStationSelectByHierarchy(row, '');
    syncContextFromStation(row);
  });

  areaSelect.addEventListener('change', () => {
    populateLineSelect(lineSelect, facilitySelect.value, areaSelect.value, '');
    refreshStationSelectByHierarchy(row, '');
    syncContextFromStation(row);
  });

  lineSelect.addEventListener('change', () => {
    refreshStationSelectByHierarchy(row, '');
    syncContextFromStation(row);
  });

  syncContextFromStation(row);
  stationSelect.addEventListener('change', () => syncContextFromStation(row));

  row.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const pickButton = target.closest('button.btn-pick-node');
    if (pickButton) {
      const inputPicker = pickButton.closest('.input-picker');
      const targetInput = inputPicker?.querySelector('input[type="text"]');
      if (targetInput instanceof HTMLInputElement) {
        openTagBrowser(targetInput);
      }
      return;
    }

    const actionButton = target.closest('button[data-action]');
    if (!actionButton) return;

    if (actionButton.dataset.action === 'add-functionality') {
      addFunctionalityToRow(row, 'custom');
      updateResolutionFromFunctionalities(row);
      return;
    }

    if (actionButton.dataset.action === 'remove-functionality') {
      const featureNode = actionButton.closest('.mapping-functionality-card');
      featureNode?.remove();
      updateFunctionalityTypeOptions(row);
      updateResolutionFromFunctionalities(row);
      return;
    }

    if (actionButton.dataset.action === 'toggle-trigger-event') {
      const eventNode = actionButton.closest('.trigger-event-item');
      const body = eventNode?.querySelector('[data-trigger-collapsible-body="true"]');
      if (eventNode && body) {
        const collapsed = eventNode.classList.toggle('is-collapsed');
        body.hidden = collapsed;
        actionButton.textContent = collapsed ? '+' : '-';
        actionButton.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      }
      return;
    }

    if (actionButton.dataset.action === 'toggle-functionality') {
      const featureNode = actionButton.closest('.mapping-functionality-card');
      const body = featureNode?.querySelector('[data-feature-collapsible-body="true"]');
      if (featureNode && body) {
        const collapsed = featureNode.classList.toggle('is-collapsed');
        body.hidden = collapsed;
        actionButton.textContent = collapsed ? '+' : '-';
        actionButton.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      }
      return;
    }

    if (actionButton.dataset.action === 'add-trigger-event') {
      const featureNode = actionButton.closest('.mapping-functionality-card');
      if (featureNode) {
        addTriggerEventToFunctionality(featureNode);
        updateResolutionFromFunctionalities(row);
      }
      return;
    }

    if (actionButton.dataset.action === 'add-custom-signal') {
      const featureNode = actionButton.closest('.mapping-functionality-card');
      if (featureNode) addCustomSignalRow(featureNode);
      return;
    }

    if (actionButton.dataset.action === 'remove-custom-signal') {
      const featureNode = actionButton.closest('.mapping-functionality-card');
      const rowNode = actionButton.closest('[data-custom-signal-row="true"]');
      rowNode?.remove();
      const remaining = featureNode?.querySelectorAll('[data-custom-signal-row="true"]').length || 0;
      if (featureNode && remaining === 0) {
        addCustomSignalRow(featureNode);
      }
      return;
    }

    if (actionButton.dataset.action === 'remove-trigger-event') {
      const triggerNode = actionButton.closest('.trigger-event-item');
      const triggersList = actionButton.closest('[data-functionality-field="triggers-list"]');
      triggerNode?.remove();
      if (triggersList && triggersList.children.length === 0) {
        triggersList.appendChild(createTriggerEventNode(normalizeTriggerEvent({ mode: 'always' }), 0));
      }
      updateResolutionFromFunctionalities(row);
      return;
    }

  });

  row.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches('[data-trigger-field="mode"]')) {
      const triggerNode = target.closest('.trigger-event-item');
      if (triggerNode) updateTriggerEventScope(triggerNode);
      updateResolutionFromFunctionalities(row);
      return;
    }

    if (target.matches('[data-functionality-field="type"]')) {
      const featureNode = target.closest('.mapping-functionality-card');
      if (!featureNode) return;
      const selectedType = String(target.value || 'custom');
      const duplicate = selectedType !== 'custom' && [...row.querySelectorAll('.mapping-functionality-card')]
        .some((node) => node !== featureNode && String(node.querySelector('[data-functionality-field="type"]')?.value || '') === selectedType);

      if (duplicate) {
        showMessage(t('mappings.typeAlreadyUsed'), true);
        target.value = 'custom';
      }

      const type = getFunctionalityTypeById(target.value);
      const nameInput = featureNode.querySelector('[data-functionality-field="name"]');
      if (nameInput && !String(nameInput.value || '').trim()) {
        nameInput.value = t(type.nameKey);
      }
      const topicInput = featureNode.querySelector('[data-functionality-field="topic"]');
      if (topicInput) {
        topicInput.placeholder = getFunctionalityTopicPlaceholder(type.id);
      }

      const existingNodes = {};
      for (const input of featureNode.querySelectorAll('[data-function-node]')) {
        const key = String(input.getAttribute('data-function-node') || '').trim();
        const value = String(input.value || '').trim();
        if (key && value) existingNodes[key] = value;
      }

      for (const customRow of featureNode.querySelectorAll('[data-custom-signal-row="true"]')) {
        const name = String(customRow.querySelector('[data-custom-signal-name="true"]')?.value || '').trim();
        const nodeId = String(customRow.querySelector('[data-custom-signal-nodeid="true"]')?.value || '').trim();
        if (name && nodeId) existingNodes[name] = nodeId;
      }

      renderFunctionalitySignals(featureNode, { type: type.id, nodes: existingNodes });
      updateFunctionalityTypeOptions(row);
      updateResolutionFromFunctionalities(row);
      return;
    }

    if (target.matches('[data-functionality-field="enabled"], [data-functionality-field="onlyOnChange"]')) {
      updateResolutionFromFunctionalities(row);
    }

    if (target.matches('[data-functionality-field="name"]')) {
      const featureNode = target.closest('.mapping-functionality-card');
      const title = featureNode?.querySelector('.feature-block-head strong');
      if (title) title.textContent = String(target.value || '').trim() || t('mappings.functionalityCustom');
    }
  });

  row.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches('[data-trigger-field="intervalSeconds"]')) {
      updateResolutionFromFunctionalities(row);
    }
  });

  updateResolutionFromFunctionalities(row);

  row.querySelector('[data-action="remove"]').addEventListener('click', () => row.remove());

  initCollapsibleCard(row, 'mapping', true);

  return row;
}

function renderMappings(mappings) {
  mappingsList.innerHTML = '';
  for (const mapping of mappings) {
    mappingsList.appendChild(createMappingNode(mapping));
  }
}

function collectMappingsFromUi() {
  const rows = [...mappingsList.querySelectorAll('.mapping-item')];
  return rows.map((row) => {
    const getValue = (selector) => row.querySelector(selector).value;

    const functionalities = collectFunctionalitiesFromRow(row);
    const legacy = buildLegacyFieldsFromFunctionalities(functionalities);

    return {
      stationId: Number.parseInt(getValue('[data-field="stationId"]') || '0', 10),
      opcServerId: getValue('[data-field="opcServerId"]').trim(),
      context: resolveContextFromRow(row),
      defaults: {
        Resolution: Number.parseInt(getValue('[data-field="Resolution"]') || '1', 10),
      },
      functionalities,
      publish: legacy.publish,
      topics: legacy.topics,
      triggers: legacy.triggers,
      nodes: legacy.nodes,
    };
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function summarizeServerState(server = {}) {
  if (server.connected) return 'Conectado';
  if (server.reason === 'disabled') return 'Deshabilitado';
  if (server.reason === 'missing endpoint') return 'Sin endpoint';
  if (/reconnect|retry|timeout|timed out|econn|refused|unavailable/i.test(String(server.reason || ''))) {
    return 'Reconectando';
  }
  return 'Desconectado';
}

function getServerBadgeClass(server = {}) {
  if (server.connected) return 'connected';
  if (server.reason === 'disabled') return 'disabled';
  if (server.reason === 'missing endpoint') return 'warning';
  if (/reconnect|retry|timeout|timed out|econn|refused|unavailable/i.test(String(server.reason || ''))) {
    return 'reconnecting';
  }
  return 'disconnected';
}

function renderStatusPanel(status = {}) {
  const summaryBox = document.getElementById('status-summary');
  const tableBody = document.getElementById('status-table-body');

  const opcServers = status.opcServers && typeof status.opcServers === 'object' ? status.opcServers : {};
  const connectedOpc = Object.values(opcServers).filter((server) => server && server.connected).length;
  const totalOpc = Object.keys(opcServers).length || Number(status.opcServersConfigured || 0);
  const mqttLabel = status.mqttConnected ? 'Conectado' : 'Reconectando';
  const mqttBadgeClass = status.mqttConnected ? 'connected' : 'reconnecting';
  const lastError = status.lastError ? String(status.lastError) : 'Sin errores';

  summaryBox.innerHTML = `
    <div class="status-summary-card">
      <span class="status-summary-label">MQTT</span>
      <strong>${escapeHtml(status.mqttUrl || 'Sin URL')}</strong>
      <span class="status-badge ${mqttBadgeClass}">${mqttLabel}</span>
    </div>
    <div class="status-summary-card">
      <span class="status-summary-label">OPC UA</span>
      <strong>${connectedOpc}/${totalOpc} servidores activos</strong>
      <span class="status-badge ${connectedOpc > 0 ? 'connected' : 'disconnected'}">${connectedOpc > 0 ? 'Activos' : 'Sin conexión'}</span>
    </div>
    <div class="status-summary-card">
      <span class="status-summary-label">Último error</span>
      <strong>${escapeHtml(lastError.length > 80 ? `${lastError.slice(0, 80)}...` : lastError)}</strong>
      <span class="status-badge ${status.lastError ? 'warning' : 'connected'}">${status.lastError ? 'Atención' : 'OK'}</span>
    </div>
  `;

  const rows = [
    {
      service: 'MQTT',
      name: 'Broker',
      endpoint: status.mqttUrl || 'Sin URL',
      state: status.mqttConnected ? 'Conectado' : 'Reconectando',
      message: status.mqttConnected ? 'Broker activo' : (status.lastError || 'Intentando reconexión…'),
      badgeClass: status.mqttConnected ? 'connected' : 'reconnecting',
      isMqtt: true,
    },
    ...Object.entries(opcServers).map(([serverId, server]) => ({
      service: 'OPC UA',
      name: serverId,
      endpoint: server && server.endpoint ? server.endpoint : 'Sin endpoint',
      state: summarizeServerState(server || {}),
      message: server && server.connected ? 'Sesión activa' : (server && server.reason ? `Reintentando conexión: ${server.reason}` : 'Sin detalle'),
      badgeClass: getServerBadgeClass(server || {}),
      isMqtt: false,
    })),
  ];

  tableBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.service)}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.endpoint)}</td>
      <td><span class="status-badge ${row.badgeClass}">${escapeHtml(row.state)}</span></td>
      <td>${row.isMqtt ? escapeHtml(row.message) : escapeHtml(row.message)}</td>
    </tr>
  `).join('');
}

function renderStatusMessages(status = {}) {
  const mqttConnected = Boolean(status.mqttConnected);
  const opcServers = status.opcServers && typeof status.opcServers === 'object' ? status.opcServers : {};
  const configuredOpcCount = Object.keys(opcServers).length || Number(status.opcServersConfigured || 0);
  const connectedOpcCount = Object.values(opcServers).filter((server) => server && server.connected).length;
  const opcIssues = Object.entries(opcServers).filter(([, server]) => server && !server.connected);
  const retrySeconds = Math.max(1, Math.round((Number(status.opcRetryIntervalMs) || 15000) / 1000));

  const mqttText = mqttConnected
    ? 'MQTT conectado y activo.'
    : (status.lastError ? `MQTT no está estable: ${status.lastError}` : 'MQTT intentando reconectarse...');

  let opcText = 'No hay servidores OPC UA configurados.';
  if (configuredOpcCount > 0) {
    const retryLine = ` Reintentando cada ${retrySeconds}s.`;
    if (opcIssues.length === 0 && connectedOpcCount === configuredOpcCount) {
      opcText = 'Todos los servidores OPC UA están conectados.';
    } else if (connectedOpcCount === 0) {
      const issueText = opcIssues.map(([id, server]) => {
        const timestamp = server?.lastAttemptAt ? ` • último intento ${new Date(server.lastAttemptAt).toLocaleTimeString()}` : '';
        return `${id}: ${server?.reason || 'desconectado'}${timestamp}`;
      }).join(' | ');
      opcText = `Ningún servidor OPC UA está conectado.${retryLine} ${issueText}`;
    } else {
      const issueText = opcIssues.map(([id, server]) => {
        const timestamp = server?.lastAttemptAt ? ` • último intento ${new Date(server.lastAttemptAt).toLocaleTimeString()}` : '';
        return `${id}: ${server?.reason || 'desconectado'}${timestamp}`;
      }).join(' | ');
      opcText = `${connectedOpcCount}/${configuredOpcCount} servidores OPC UA conectados.${retryLine} ${issueText}`;
    }
  }

  if (statusMqttMessage) {
    statusMqttMessage.textContent = mqttText;
    statusMqttMessage.style.color = mqttConnected ? '#166534' : '#b91c1c';
  }

  if (statusOpcMessage) {
    statusOpcMessage.textContent = opcText;
    statusOpcMessage.style.color = configuredOpcCount > 0 && connectedOpcCount === configuredOpcCount ? '#166534' : '#b91c1c';
  }

  showMessage(
    mqttConnected ? 'MQTT OK.' : `MQTT: ${mqttText} | OPC UA: ${opcText}`,
    !mqttConnected || (configuredOpcCount > 0 && connectedOpcCount !== configuredOpcCount)
  );
}

async function refreshStatus() {
  const data = await apiFetch('/api/status');
  renderStatusPanel(data.status);
  renderStatusMessages(data.status);
}

function nodeMatchesQuery(node, query) {
  if (!query) return true;

  const haystack = [node.displayName, node.browseName, node.nodeId, node.nodeClass]
    .map((part) => normalizeSearchText(part))
    .join(' ');

  return haystack.includes(query);
}

function setSelectedNode(nodeId) {
  browserState.selectedNodeId = nodeId || '';
  browserSelectedNodeInput.value = browserState.selectedNodeId;
}

function hasMatchInLoadedDescendants(nodeId, query) {
  if (!query) return true;

  const children = browserState.childrenByNodeId.get(nodeId) || [];
  for (const child of children) {
    if (nodeMatchesQuery(child, query)) return true;
    if (hasMatchInLoadedDescendants(child.nodeId, query)) return true;
  }

  return false;
}

function renderBrowserRows(children = [], depth = 0) {
  const fragment = document.createDocumentFragment();
  const query = normalizeSearchText(browserState.searchQuery);

  for (const child of children) {
    const shouldShow = nodeMatchesQuery(child, query) || hasMatchInLoadedDescendants(child.nodeId, query);
    if (!shouldShow) continue;

    const row = document.createElement('div');
    row.className = 'browser-row';
    if (browserState.selectedNodeId === child.nodeId) row.classList.add('selected');
    row.style.setProperty('--depth', String(depth));

    const left = document.createElement('div');
    left.className = 'browser-left';

    const title = document.createElement('strong');
    title.className = 'browser-title';
    title.innerHTML = escapeHtml(child.displayName || child.browseName || child.nodeId);

    const meta = document.createElement('div');
    meta.className = 'browser-meta';
    meta.innerHTML = `
      <span>${escapeHtml(child.nodeClass || 'Unknown')}</span>
      <span>${escapeHtml(child.browseName || '')}</span>
      <span>${escapeHtml(child.nodeId || '')}</span>
    `;

    left.appendChild(title);
    left.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'browser-actions';

    const btnExpand = document.createElement('button');
    btnExpand.type = 'button';
    btnExpand.className = 'btn btn-secondary';
    btnExpand.textContent = browserState.expandedNodeIds.has(child.nodeId) ? t('browser.collapse') : t('browser.expand');
    btnExpand.addEventListener('click', async () => {
      try {
        await toggleNodeExpanded(child.nodeId);
      } catch (error) {
        showMessage(error.message, true);
      }
    });

    const btnSelect = document.createElement('button');
    btnSelect.type = 'button';
    btnSelect.className = 'btn btn-secondary';
    btnSelect.textContent = t('browser.select');
    btnSelect.addEventListener('click', () => {
      setSelectedNode(child.nodeId);
      renderBrowserTree();
      showMessage(tf('browser.selected', { nodeId: child.nodeId }));
    });

    const btnUse = document.createElement('button');
    btnUse.type = 'button';
    btnUse.className = 'btn';
    btnUse.textContent = t('browser.useShort');
    btnUse.addEventListener('click', () => {
      setSelectedNode(child.nodeId);
      try {
        useSelectedInActiveField();
      } catch (error) {
        showMessage(error.message, true);
      }
    });

    actions.appendChild(btnExpand);
    actions.appendChild(btnSelect);
    actions.appendChild(btnUse);

    row.appendChild(left);
    row.appendChild(actions);
    fragment.appendChild(row);

    if (browserState.expandedNodeIds.has(child.nodeId)) {
      if (browserState.loadingNodeIds.has(child.nodeId)) {
        const loading = document.createElement('div');
        loading.className = 'browser-row browser-loading';
        loading.style.setProperty('--depth', String(depth + 1));
        loading.textContent = t('browser.loading');
        fragment.appendChild(loading);
      } else {
        const subChildren = browserState.childrenByNodeId.get(child.nodeId) || [];
        if (subChildren.length > 0) {
          fragment.appendChild(renderBrowserRows(subChildren, depth + 1));
        } else {
          const empty = document.createElement('div');
          empty.className = 'browser-row browser-loading';
          empty.style.setProperty('--depth', String(depth + 1));
          empty.textContent = t('browser.noChildren');
          fragment.appendChild(empty);
        }
      }
    }
  }

  return fragment;
}

function renderBrowserTree() {
  browserList.innerHTML = '';
  const rootChildren = browserState.childrenByNodeId.get(browserState.currentNodeId) || [];
  const query = normalizeSearchText(browserState.searchQuery);
  const visibleCount = query
    ? rootChildren.filter((node) => nodeMatchesQuery(node, query) || hasMatchInLoadedDescendants(node.nodeId, query)).length
    : rootChildren.length;

  if (rootChildren.length === 0 || visibleCount === 0) {
    const empty = document.createElement('div');
    empty.className = 'browser-row';
    empty.innerHTML = `<div>${rootChildren.length === 0 ? t('browser.noChildren') : t('browser.noMatches')}</div>`;
    browserList.appendChild(empty);
    return;
  }

  browserList.appendChild(renderBrowserRows(rootChildren, 0));
}

async function loadNodeChildren(nodeId, { force = false } = {}) {
  const target = String(nodeId || 'RootFolder').trim() || 'RootFolder';

  if (!force && browserState.childrenByNodeId.has(target)) {
    return browserState.childrenByNodeId.get(target) || [];
  }

  browserState.loadingNodeIds.add(target);
  renderBrowserTree();

  try {
    const serverId = browserState.selectedServerId || browserServerSelect.value || '';
    const data = await apiFetch(`/api/opc/browse?serverId=${encodeURIComponent(serverId)}&nodeId=${encodeURIComponent(target)}`);
    const children = Array.isArray(data.children) ? data.children : [];
    browserState.childrenByNodeId.set(data.nodeId, children);
    return children;
  } finally {
    browserState.loadingNodeIds.delete(target);
  }
}

async function toggleNodeExpanded(nodeId) {
  const target = String(nodeId || '').trim();
  if (!target) return;

  if (browserState.expandedNodeIds.has(target)) {
    browserState.expandedNodeIds.delete(target);
    renderBrowserTree();
    return;
  }

  browserState.expandedNodeIds.add(target);
  await loadNodeChildren(target);
  renderBrowserTree();
}

async function browseNode(nodeId, { pushHistory = false } = {}) {
  const target = String(nodeId || 'RootFolder').trim() || 'RootFolder';

  if (pushHistory && browserState.currentNodeId && browserState.currentNodeId !== target) {
    browserState.history.push(browserState.currentNodeId);
  }

  browserState.currentNodeId = target;
  browserCurrentNodeInput.value = target;
  browserState.expandedNodeIds.clear();
  await loadNodeChildren(target, { force: true });
  renderBrowserTree();

  const children = browserState.childrenByNodeId.get(target) || [];
  showMessage(tf('browser.browseOk', { count: children.length }));
}

async function readSelectedNodeValue() {
  if (!browserState.selectedNodeId) {
    throw new Error(t('browser.selectFirst'));
  }

  const serverId = browserState.selectedServerId || browserServerSelect.value || '';
  const data = await apiFetch(`/api/opc/read?serverId=${encodeURIComponent(serverId)}&nodeId=${encodeURIComponent(browserState.selectedNodeId)}`);
  browserNodeValueBox.textContent = JSON.stringify(data, null, 2);
}

function useSelectedInActiveField() {
  if (!browserState.selectedNodeId) throw new Error(t('browser.selectBrowserNode'));
  if (!browserState.activeTargetInput) throw new Error(t('browser.selectDestination'));

  browserState.activeTargetInput.value = browserState.selectedNodeId;
  browserState.activeTargetInput.dispatchEvent(new Event('input', { bubbles: true }));
  showMessage(tf('browser.applied', { nodeId: browserState.selectedNodeId }));
}

async function loadAll() {
  const [cfg, mps] = await Promise.all([
    apiFetch('/api/config'),
    apiFetch('/api/mappings'),
  ]);

  appState.config = cfg.config;
  appState.mappings = mps.mappings || [];

  fillConfigForm(appState.config);
  renderOpcServers(getOpcServersFromConfig());

  try {
    await loadConnectMesStations();
  } catch (error) {
    appState.stations = [];
    appState.stationsById = new Map();
    showMessage(tf('connectmes.stationsError', { error: error.message }), true);
  }

  renderMappings(appState.mappings);
  await refreshStatus();
}

async function validateSession(token) {
  return apiFetch('/api/auth/session', {
    skipAuth: true,
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function performLogin(username, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ username, password }),
  });
}

async function bootstrapAfterAuth() {
  await loadAll();
  await browseNode('RootFolder');
}

async function restoreSessionIfExists() {
  const token = getStoredToken();
  if (!token) {
    showLoginView();
    return;
  }

  try {
    const session = await validateSession(token);
    appState.user = session.user || null;
    renderUserIdentity(appState.user);
    showAppView();
    await bootstrapAfterAuth();
  } catch {
    clearLocalSession();
    showLoginView();
  }
}

document.getElementById('btn-refresh-status').addEventListener('click', async () => {
  try {
    await refreshStatus();
    showMessage(t('status.updated'));
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById('btn-save-config').addEventListener('click', async () => {
  try {
    setSaveStatus(configSaveStatus, 'Guardando configuración...', 'saving');
    const payload = getConfigPayload();
    const data = await apiFetch('/api/config', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    appState.config = data.config;
    renderOpcServers(getOpcServersFromConfig());
    renderMappings(collectMappingsFromUi());
    await refreshStatus();

    if (data.warning) {
      setSaveStatus(configSaveStatus, 'Configuración guardada · reconectando...', 'warning');
      showMessage(data.warning, true);
    } else {
      setSaveStatus(configSaveStatus, 'Configuración guardada', 'success');
      showMessage(t('settings.saved'));
    }
  } catch (error) {
    setSaveStatus(configSaveStatus, error.message || 'Error al guardar', 'error');
    showMessage(error.message, true);
  }
});

document.getElementById('btn-save-opc-servers').addEventListener('click', async () => {
  try {
    setSaveStatus(opcServersSaveStatus, 'Guardando servidores OPC...', 'saving');
    const payload = getConfigPayload();
    const data = await apiFetch('/api/config', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    appState.config = data.config;
    renderOpcServers(getOpcServersFromConfig());
    renderMappings(collectMappingsFromUi());
    await refreshStatus();

    if (data.warning) {
      setSaveStatus(opcServersSaveStatus, 'Servidores guardados · reconectando...', 'warning');
      showMessage(data.warning, true);
    } else {
      setSaveStatus(opcServersSaveStatus, 'Servidores OPC guardados', 'success');
      showMessage(t('settings.opcSaved'));
    }
  } catch (error) {
    setSaveStatus(opcServersSaveStatus, error.message || 'Error al guardar', 'error');
    showMessage(error.message, true);
  }
});

document.getElementById('btn-reconnect').addEventListener('click', async () => {
  try {
    await apiFetch('/api/runtime/reconnect', { method: 'POST' });
    await refreshStatus();
    showMessage(t('settings.reconnected'));
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById('btn-reload-stations').addEventListener('click', async () => {
  try {
    await loadConnectMesStations();
    renderMappings(collectMappingsFromUi());
    showMessage(t('settings.stationsReloaded'));
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById('btn-add-opc-server').addEventListener('click', () => {
  const servers = collectOpcServersFromDom();
  const nextId = `opc-${servers.length + 1}`;

  const currentMappings = collectMappingsFromUi();
  servers.push({
    id: nextId,
    name: `OPC Server ${servers.length + 1}`,
    endpoint: '',
    enabled: true,
    securityMode: 'None',
    securityPolicy: 'None',
    authType: 'anonymous',
    username: '',
    password: '',
    userCertificateFile: '',
    userPrivateKeyFile: '',
    userCertificateRef: '',
    userPrivateKeyRef: '',
  });

  appState.config = {
    ...appState.config,
    opcua: {
      defaultServerId: appState.config?.opcua?.defaultServerId || nextId,
      servers,
    },
  };

  renderOpcServers(servers);
  renderMappings(currentMappings);
});

document.getElementById('btn-add-mapping').addEventListener('click', () => {
  mappingsList.appendChild(createMappingNode({ opcServerId: getDefaultOpcServerId() }));
});

if (expandAllOpcButton) {
  expandAllOpcButton.addEventListener('click', () => {
    setCardsCollapsedByType('opc', false);
  });
}

if (collapseAllOpcButton) {
  collapseAllOpcButton.addEventListener('click', () => {
    setCardsCollapsedByType('opc', true);
  });
}

if (expandAllMappingsButton) {
  expandAllMappingsButton.addEventListener('click', () => {
    setCardsCollapsedByType('mapping', false);
  });
}

if (collapseAllMappingsButton) {
  collapseAllMappingsButton.addEventListener('click', () => {
    setCardsCollapsedByType('mapping', true);
  });
}

if (backupFileInput && backupFileNameInput) {
  backupFileInput.addEventListener('change', () => {
    const file = backupFileInput.files?.[0] || null;
    backupImportDraft = null;
    backupFileNameInput.value = file ? file.name : '';
  });
}

if (backupDownloadButton) {
  backupDownloadButton.addEventListener('click', () => {
    try {
      const payload = getBackupPayload();
      downloadBackupFile(payload);
      showMessage(t('backup.downloaded'));
    } catch (error) {
      showMessage(error.message, true);
    }
  });
}

if (backupImportButton && backupFileInput) {
  backupImportButton.addEventListener('click', async () => {
    try {
      const file = backupFileInput.files?.[0] || null;
      if (!file) {
        throw new Error(t('backup.fileRequired'));
      }

      backupImportDraft = await readBackupDraftFromFile(file);
      openBackupImportModeModal(file.name);
    } catch (error) {
      showMessage(error.message, true);
    }
  });
}

if (backupImportModeCloseButton) {
  backupImportModeCloseButton.addEventListener('click', closeBackupImportModeModal);
}

if (backupImportModeCancelButton) {
  backupImportModeCancelButton.addEventListener('click', closeBackupImportModeModal);
}

if (backupImportModeModal) {
  backupImportModeModal.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.modalClose === 'true') {
      closeBackupImportModeModal();
    }
  });
}

document.querySelectorAll('input[name="backup-import-mode"]').forEach((input) => {
  input.addEventListener('change', refreshImportModeOptionsUi);
});

if (backupImportModeConfirmButton && backupFileInput) {
  backupImportModeConfirmButton.addEventListener('click', async () => {
    try {
      const file = backupFileInput.files?.[0] || null;
      if (!file) {
        throw new Error(t('backup.fileRequired'));
      }

      const mode = getSelectedBackupImportMode();
      const normalized = backupImportDraft || await readBackupDraftFromFile(file);
      await importBackupFromDraft(normalized, mode);
      closeBackupImportModeModal();
      backupImportDraft = null;
      showMessage(mode === 'merge' ? t('backup.importedMerge') : t('backup.importedOverwrite'));
    } catch (error) {
      showMessage(error.message, true);
    }
  });
}

document.getElementById('btn-save-mappings').addEventListener('click', async () => {
  try {
    const payload = collectMappingsFromUi();
    await apiFetch('/api/mappings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    await refreshStatus();
    showMessage(t('mappings.saved'));
  } catch (error) {
    showMessage(error.message, true);
  }
});

browserServerSelect.addEventListener('change', () => {
  browserState.selectedServerId = browserServerSelect.value || '';
  browserState.childrenByNodeId.clear();
  browserState.expandedNodeIds.clear();
  browseNode('RootFolder').catch((error) => showMessage(error.message, true));
});

document.getElementById('btn-browse-root').addEventListener('click', async () => {
  try {
    await browseNode('RootFolder', { pushHistory: true });
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById('btn-browse-node').addEventListener('click', async () => {
  try {
    await browseNode(browserCurrentNodeInput.value, { pushHistory: true });
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById('btn-browse-back').addEventListener('click', async () => {
  try {
    const previous = browserState.history.pop();
    if (!previous) {
      showMessage(t('browser.noHistory'));
      return;
    }
    await browseNode(previous);
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById('btn-read-selected').addEventListener('click', async () => {
  try {
    await readSelectedNodeValue();
    showMessage(t('browser.readDone'));
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById('btn-use-selected').addEventListener('click', () => {
  try {
    useSelectedInActiveField();
    closeTagBrowser();
  } catch (error) {
    showMessage(error.message, true);
  }
});

browserSearchInput.addEventListener('input', () => {
  browserState.searchQuery = browserSearchInput.value || '';
  renderBrowserTree();
});

document.getElementById('btn-browser-search-clear').addEventListener('click', () => {
  browserState.searchQuery = '';
  browserSearchInput.value = '';
  renderBrowserTree();
});

document.getElementById('btn-close-modal').addEventListener('click', closeTagBrowser);
modal.addEventListener('click', (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.modalClose === 'true') {
    closeTagBrowser();
  }
});

document.addEventListener('focusin', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  const isNodeInput = target.hasAttribute('data-node');
  const isFunctionNodeInput = target.hasAttribute('data-function-node');
  const isCustomFunctionNodeInput = target.hasAttribute('data-custom-signal-nodeid');
  const triggerField = target.getAttribute('data-trigger-field') || '';
  const isTriggerInput = triggerField === 'triggerNodeId';

  if (isNodeInput || isFunctionNodeInput || isCustomFunctionNodeInput || isTriggerInput) {
    setActiveTarget(target);
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginErrorBox.textContent = '';

  const username = String(loginUsernameInput.value || '').trim();
  const password = String(loginPasswordInput.value || '');

  if (!username || !password) {
    loginErrorBox.textContent = t('login.fillFields');
    return;
  }

  const loginButton = document.getElementById('btn-login');
  loginButton.disabled = true;
  loginButton.textContent = t('login.validating');

  try {
    const data = await performLogin(username, password);
    setStoredToken(data.token);
    appState.user = data.user || { username, roles: ['Optimotion'] };
    renderUserIdentity(appState.user);
    showAppView();
    await bootstrapAfterAuth();
  } catch (error) {
    loginErrorBox.textContent = error.message;
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = t('login.submit');
  }
});

logoutButton.addEventListener('click', async () => {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignore logout API failures and clear local session anyway.
  }

  clearLocalSession();
  showLoginView();
});

if (langToggleButton) {
  langToggleButton.addEventListener('click', cycleLanguage);
}
if (langToggleLoginButton) {
  langToggleLoginButton.addEventListener('click', cycleLanguage);
}
if (langToggleModalButton) {
  langToggleModalButton.addEventListener('click', cycleLanguage);
}
if (themeToggleButton) {
  themeToggleButton.addEventListener('click', toggleTheme);
}
if (themeToggleLoginButton) {
  themeToggleLoginButton.addEventListener('click', toggleTheme);
}
if (themeToggleModalButton) {
  themeToggleModalButton.addEventListener('click', toggleTheme);
}

initTabs();

setLanguage(getCurrentLanguage());
setTheme(getCurrentTheme());

if (backupFileNameInput) {
  backupFileNameInput.value = '';
}

restoreSessionIfExists().catch((error) => {
  showLoginView();
  loginErrorBox.textContent = error.message;
});
