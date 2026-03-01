#include "oled.h"
#include "config.h"
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

namespace
{
  Adafruit_SSD1306 sDisplay(config::kScreenWidth, config::kScreenHeight, &Wire, -1);
  uint16_t sNekoFrame = 0;
}

namespace oled
{
  bool init()
  {
    Wire.begin(config::kOledSda, config::kOledScl);
    if (!sDisplay.begin(SSD1306_SWITCHCAPVCC, config::kOledAddr))
    {
      Serial.println("OLED init failed");
      return false;
    }
    Serial.println("OLED ready: 128x64 on GPIO 16/17");
    return true;
  }

  void drawNekoFrame()
  {
    sDisplay.clearDisplay();
    int cx = 64;

    // Body
    sDisplay.fillRoundRect(cx - 10, 38, 20, 18, 6, SSD1306_WHITE);

    // Head
    sDisplay.fillCircle(cx, 24, 15, SSD1306_WHITE);

    // Ears
    sDisplay.fillTriangle(cx - 16, 16, cx - 8, 0, cx - 2, 14, SSD1306_WHITE);
    sDisplay.fillTriangle(cx + 2, 14, cx + 8, 0, cx + 16, 16, SSD1306_WHITE);
    // Inner ears
    sDisplay.fillTriangle(cx - 13, 16, cx - 8, 5, cx - 5, 14, SSD1306_BLACK);
    sDisplay.fillTriangle(cx + 5, 14, cx + 8, 5, cx + 13, 16, SSD1306_BLACK);

    // Eyes
    bool blink = (sNekoFrame % 24 < 2);
    if (blink)
    {
      // Happy squint ^_^
      sDisplay.drawLine(cx - 10, 23, cx - 7, 20, SSD1306_BLACK);
      sDisplay.drawLine(cx - 7, 20, cx - 4, 23, SSD1306_BLACK);
      sDisplay.drawLine(cx + 4, 23, cx + 7, 20, SSD1306_BLACK);
      sDisplay.drawLine(cx + 7, 20, cx + 10, 23, SSD1306_BLACK);
    }
    else
    {
      // Big cute eyes with highlights
      sDisplay.fillCircle(cx - 6, 22, 4, SSD1306_BLACK);
      sDisplay.fillCircle(cx + 6, 22, 4, SSD1306_BLACK);
      sDisplay.fillCircle(cx - 4, 20, 1, SSD1306_WHITE);
      sDisplay.fillCircle(cx + 8, 20, 1, SSD1306_WHITE);
    }

    // Nose
    sDisplay.fillTriangle(cx, 30, cx - 2, 28, cx + 2, 28, SSD1306_BLACK);

    // Mouth
    sDisplay.drawLine(cx, 30, cx - 3, 33, SSD1306_BLACK);
    sDisplay.drawLine(cx, 30, cx + 3, 33, SSD1306_BLACK);

    // Whiskers
    sDisplay.drawLine(cx - 15, 25, cx - 28, 22, SSD1306_WHITE);
    sDisplay.drawLine(cx - 15, 27, cx - 28, 27, SSD1306_WHITE);
    sDisplay.drawLine(cx + 15, 25, cx + 28, 22, SSD1306_WHITE);
    sDisplay.drawLine(cx + 15, 27, cx + 28, 27, SSD1306_WHITE);

    // Paws
    sDisplay.fillCircle(cx - 7, 55, 4, SSD1306_WHITE);
    sDisplay.fillCircle(cx + 7, 55, 4, SSD1306_WHITE);
    // Toe beans
    sDisplay.drawPixel(cx - 9, 56, SSD1306_BLACK);
    sDisplay.drawPixel(cx - 7, 57, SSD1306_BLACK);
    sDisplay.drawPixel(cx - 5, 56, SSD1306_BLACK);
    sDisplay.drawPixel(cx + 5, 56, SSD1306_BLACK);
    sDisplay.drawPixel(cx + 7, 57, SSD1306_BLACK);
    sDisplay.drawPixel(cx + 9, 56, SSD1306_BLACK);

    // Tail (wagging)
    int dir = ((sNekoFrame / 4) % 2 == 0) ? 1 : -1;
    for (int i = 0; i < 14; i++)
    {
      float t = i / 13.0f;
      int tx = cx + dir * (12 + int(t * 14));
      int ty = 48 - int(t * t * 18);
      sDisplay.drawPixel(tx, ty, SSD1306_WHITE);
      sDisplay.drawPixel(tx, ty + 1, SSD1306_WHITE);
    }

    // Label
    sDisplay.setTextSize(1);
    sDisplay.setTextColor(SSD1306_WHITE);
    sDisplay.setCursor(88, 56);
    sDisplay.print("nyan~");

    sDisplay.display();
    sNekoFrame++;
  }
}
