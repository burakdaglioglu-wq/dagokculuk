@echo off
setlocal
chcp 65001 >nul
title DAG S.K. - Salon kamerasi koprusu
rem Tapo C212 (RTSP) -> go2rtc -> Form Lab (WebRTC / MSE). Uygulamadan indirilir; ayarlar %USERPROFILE%\dagsk-kamera icinde kalir.
set "KLASOR=%USERPROFILE%\dagsk-kamera"
if not exist "%KLASOR%" mkdir "%KLASOR%"
cd /d "%KLASOR%"
echo.
echo  ===  DAG S.K. Salon Kamerasi Koprusu  (Tapo -^> Form Lab)  ===
echo.
if exist go2rtc.exe goto ayar
echo  go2rtc indiriliyor (yalnizca ilk sefer, yaklasik 10 MB)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol='Tls12'; Invoke-WebRequest -UseBasicParsing -Uri 'https://github.com/AlexxIT/go2rtc/releases/latest/download/go2rtc_win64.zip' -OutFile 'go2rtc.zip'; Expand-Archive -Force 'go2rtc.zip' '.'; Remove-Item 'go2rtc.zip'"
if exist go2rtc.exe goto ayar
echo.
echo  HATA: go2rtc indirilemedi. PC internete bagli mi (telefon hotspot)? Sonra bu dosyayi yeniden calistir.
pause
exit /b 1

:ayar
set "TAPO_IP="
set "TAPO_KUL="
set "TAPO_SIFRE="
if exist ayar.cmd call ayar.cmd
if not defined TAPO_IP goto sor
echo  Kayitli kamera IP: %TAPO_IP%    kullanici: %TAPO_KUL%
echo  (Kullanici/sifre degistiyse bu pencereyi kapat, %KLASOR%\ayar.cmd dosyasini sil, yeniden calistir.)
set "YENI_IP="
set /p "YENI_IP= IP degistiyse yeni IP'yi yaz, ayni ise sadece Enter: "
if defined YENI_IP set "TAPO_IP=%YENI_IP%"
goto yaz

:sor
echo  Tapo uygulamasi: Kamera ^> Ayarlar ^> Gelismis Ayarlar ^> Kamera Hesabi
echo  Sifrede yalnizca harf ve rakam kullan.
echo  IP: Tapo uygulamasi ^> Kamera ^> Ayarlar ^> Cihaz Bilgisi
echo.
set /p "TAPO_IP= Kameranin IP adresi (ornek 192.168.43.50): "
set /p "TAPO_KUL= Kamera hesabi kullanici adi: "
set /p "TAPO_SIFRE= Kamera hesabi sifresi: "
if not defined TAPO_IP goto sor
if not defined TAPO_KUL goto sor
if not defined TAPO_SIFRE goto sor

:yaz
(
echo set "TAPO_IP=%TAPO_IP%"
echo set "TAPO_KUL=%TAPO_KUL%"
echo set "TAPO_SIFRE=%TAPO_SIFRE%"
)> ayar.cmd
(
echo api:
echo   listen: "127.0.0.1:1984"
echo   origin: "*"
echo rtsp:
echo   listen: ""
echo webrtc:
echo   listen: ":8555"
echo streams:
echo   tapo: rtsp://%TAPO_KUL%:%TAPO_SIFRE%@%TAPO_IP%:554/stream1
echo   tapo_dusuk: rtsp://%TAPO_KUL%:%TAPO_SIFRE%@%TAPO_IP%:554/stream2
)> go2rtc.yaml
echo.
echo  Kamera kontrol ediliyor (%TAPO_IP%)...
ping -n 1 -w 1500 %TAPO_IP% >nul
if errorlevel 1 (echo  UYARI: %TAPO_IP% yanit vermiyor. Tapo ile PC ayni hotspot'ta mi, IP dogru mu?) else (echo  Kamera agda gorunuyor.)
echo.
echo  Kopru calisiyor. BU PENCEREYI KAPATMA.
echo  Form Lab'da kamera listesinden "Salon kamerasi (Tapo)" sec.
echo  Windows guvenlik duvari sorarsa "Erisime izin ver" de.
echo.
go2rtc.exe
echo.
echo  Kopru durdu.
pause
