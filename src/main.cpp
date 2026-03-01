#include <Arduino.h>
#include "config.h"
#include "led_strip.h"
#include "oled.h"

namespace
{
  bool gOledReady = false;
  uint16_t gHue = 0;
  uint32_t gLastLedMs = 0;
  uint32_t gLastNekoMs = 0;

  void renderLedFrame()
  {
    for (uint16_t i = 0; i < led::count(); i++)
    {
      uint16_t pixelHue = gHue + (i * 1536 / led::count());
      uint8_t r, g, b;
      led::hsvToRgb(pixelHue, 255, config::kLedBrightness, r, g, b);
      led::setPixel(i, r, g, b);
    }
    led::show();
    gHue -= 16;
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
    oled::drawNekoFrame();
  }

  led::init();
}

void loop()
{
  uint32_t now = millis();
  if ((uint32_t)(now - gLastLedMs) >= config::kLedFrameMs)
  {
    gLastLedMs = now;
    renderLedFrame();
  }
  if (gOledReady && (uint32_t)(now - gLastNekoMs) >= config::kNekoFrameMs)
  {
    gLastNekoMs = now;
    oled::drawNekoFrame();
  }
}
