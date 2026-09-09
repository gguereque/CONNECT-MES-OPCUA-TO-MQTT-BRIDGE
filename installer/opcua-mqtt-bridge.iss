[Setup]
AppName=ConnectMES OPC UA MQTT Bridge
AppVersion={#MyAppVersion}
AppPublisher=Optimotion
AppPublisherURL=https://optimotion.com
AppSupportURL=https://optimotion.com
AppUpdatesURL=https://optimotion.com
AppCopyright=Copyright © Optimotion
AppContact=soporte@optimotion.com
AppId=ConnectMES.OPCUA.MQTT.Bridge
DefaultDirName={autopf}\ConnectMES\opcua-mqtt-bridge
DefaultGroupName=ConnectMES
OutputBaseFilename=connectmes-opcua-mqtt-bridge
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog
WizardStyle=modern
LicenseFile=connectmes-license.txt
InfoBeforeFile=connectmes-welcome.txt
InfoAfterFile=connectmes-finish.txt
CreateAppDir=yes
CreateUninstallRegKey=yes
UninstallDisplayIcon={app}\opcua-mqtt-bridge.exe

[Files]
Source: "..\dist-server\opcua-mqtt-bridge.exe"; DestDir: "{app}"
Source: "..\dist-server\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs
Source: "nssm.exe"; DestDir: "{app}\tools"; Flags: ignoreversion
Source: "connectmes-license.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "connectmes-welcome.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "connectmes-finish.txt"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\ConnectMES OPC UA MQTT Bridge"; Filename: "{app}\opcua-mqtt-bridge.exe"

[Run]
Filename: "{app}\opcua-mqtt-bridge.exe"; Description: "Run ConnectMES OPC UA MQTT Bridge"; Flags: nowait postinstall skipifsilent

[Code]
var
  PortPage: TInputQueryWizardPage;
  BridgePort: string;

procedure InitializeWizard();
begin
  PortPage := CreateInputQueryPage(
    wpWelcome,
    'Puerto del bridge',
    'Configuración del servicio',
    'Introduce el puerto HTTP en el que escuchará el bridge de OPC UA. El valor recomendado es 3400.'
  );
  PortPage.Add('Puerto del bridge:', False);
  PortPage.Values[0] := '3400';
end;

function IsPortValid(portText: string): Boolean;
var
  portNumber: Integer;
begin
  Result := False;
  if Trim(portText) = '' then
    Exit;

  if not TryStrToInt(Trim(portText), portNumber) then
    Exit;

  if (portNumber < 1) or (portNumber > 65535) then
    Exit;

  Result := True;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  portText: string;
begin
  Result := True;

  if CurPageID = PortPage.ID then
  begin
    portText := Trim(PortPage.Values[0]);
    if not IsPortValid(portText) then
    begin
      MsgBox('Introduce un puerto válido entre 1 y 65535.', mbError, MB_OK);
      Result := False;
      Exit;
    end;

    BridgePort := portText;
  end;
end;

procedure WriteBridgeEnvFile();
var
  envPath: string;
  envText: string;
begin
  envPath := ExpandConstant('{app}') + '\.env';
  envText :=
    'BRIDGE_WEB_PORT=' + BridgePort + #13#10 +
    'BRIDGE_DB_PATH=./data/bridge.db' + #13#10 +
    'MAPPING_FILE=./config/mapping.json' + #13#10 +
    'LOG_LEVEL=info' + #13#10 +
    'TOPIC_OEE=optimotion/oee' + #13#10 +
    'TOPIC_ESTOP=optimotion/estop' + #13#10;

  SaveStringToFile(envPath, envText, False);
end;

procedure InstallWindowsService();
var
  nssmPath: string;
  serviceName: string;
  serviceExe: string;
  appDir: string;
  resultCode: Integer;
begin
  serviceName := 'ConnectMES OPC UA MQTT Bridge';
  appDir := ExpandConstant('{app}');
  serviceExe := appDir + '\opcua-mqtt-bridge.exe';
  nssmPath := appDir + '\tools\nssm.exe';

  if not FileExists(nssmPath) then
  begin
    MsgBox('NSSM no está disponible. El servicio no se registrará automáticamente.', mbInformation, MB_OK);
    Exit;
  end;

  if Exec(nssmPath, 'install "' + serviceName + '" "' + serviceExe + '"', '', SW_HIDE, ewWaitUntilTerminated, resultCode) then
  begin
    Sleep(1500);
    Exec(nssmPath, 'set "' + serviceName + '" AppDirectory "' + appDir + '"', '', SW_HIDE, ewWaitUntilTerminated, resultCode);
    Exec(nssmPath, 'set "' + serviceName + '" AppEnvironmentExtra "BRIDGE_WEB_PORT=' + BridgePort + '"', '', SW_HIDE, ewWaitUntilTerminated, resultCode);
    Exec(nssmPath, 'set "' + serviceName + '" Description "ConnectMES OPC UA MQTT Bridge"', '', SW_HIDE, ewWaitUntilTerminated, resultCode);
    Exec(nssmPath, 'start "' + serviceName + '"', '', SW_HIDE, ewWaitUntilTerminated, resultCode);
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    WriteBridgeEnvFile();
    InstallWindowsService();
  end;
end;
