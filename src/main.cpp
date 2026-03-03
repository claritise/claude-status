#include <Arduino.h>
#include "config.h"
#include "led_strip.h"
#include "oled.h"

namespace
{
  bool gOledReady = false;
  uint32_t gLastLedMs = 0;
  uint32_t gLastNekoMs = 0;
  char gCmdBuf[32];
  uint8_t gCmdLen = 0;

  void handleCommand(const char *cmd)
  {
    if (strcmp(cmd, "idle") == 0)        { oled::setAnim(oled::IDLE);    led::setActive(false); }
    else if (strcmp(cmd, "running") == 0) { oled::setAnim(oled::RUNNING); led::setActive(true);  }
    else if (strcmp(cmd, "typing") == 0)  { oled::setAnim(oled::TYPING);  led::setActive(true);  }
    else { Serial.print("unknown: "); Serial.println(cmd); return; }
    Serial.print("anim="); Serial.println(cmd);
  }

  void pollSerial()
  {
    while (Serial.available())
    {
      char c = Serial.read();
      if (c == '\n' || c == '\r')
      {
        if (gCmdLen > 0)
        {
          gCmdBuf[gCmdLen] = '\0';
          handleCommand(gCmdBuf);
          gCmdLen = 0;
        }
      }
      else if (gCmdLen < sizeof(gCmdBuf) - 1)
      {
        gCmdBuf[gCmdLen++] = c;
      }
    }
  }
}

void setup()
{
  Serial.begin(115200);
  delay(500);
  Serial.println("Booting...");

  gOledReady = oled::init();
  if (gOledReady)
  {
    oled::drawFrame();
  }

  led::init();
}

void loop()
{
  pollSerial();

  uint32_t now = millis();
  if ((uint32_t)(now - gLastLedMs) >= config::kLedFrameMs)
  {
    gLastLedMs = now;
    led::tick();
  }
  if (gOledReady && (uint32_t)(now - gLastNekoMs) >= config::kNekoFrameMs)
  {
    gLastNekoMs = now;
    oled::drawFrame();
  }
}
