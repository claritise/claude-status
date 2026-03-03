#include "oled.h"
#include "config.h"
#include "thinking.h"
#include "running.h"
#include "typing.h"
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

namespace
{
  Adafruit_SSD1306 sDisplay(config::kScreenWidth, config::kScreenHeight, &Wire, -1);

  // --- Animation state ---

  oled::Anim sAnim = oled::IDLE;
  uint16_t sFrame = 0;
  // Center the 64x64 sprite on the 128x64 display
  constexpr int16_t kSpriteX = (config::kScreenWidth - kIdleW) / 2;
  constexpr int16_t kSpriteY = 0;

  struct AnimData
  {
    const uint8_t * const *frames;
    uint8_t count;
    uint8_t w;
    uint8_t h;
  };

  constexpr AnimData kAnims[] = {
    { kIdleFrames,    kIdleFrameCount,    kIdleW,    kIdleH    },
    { kRunningFrames, kRunningFrameCount, kRunningW, kRunningH },
    { kTypingFrames,  kTypingFrameCount,  kTypingW,  kTypingH  },
  };

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

  void setAnim(Anim a)
  {
    if (a == sAnim) return;
    sAnim = a;
    sFrame = 0;
  }

  void drawFrame()
  {
    sDisplay.clearDisplay();

    const AnimData &ad = kAnims[sAnim];
    const uint8_t *frame = (const uint8_t *)pgm_read_ptr(&ad.frames[sFrame % ad.count]);
    sDisplay.drawBitmap(kSpriteX, kSpriteY, frame, ad.w, ad.h, SSD1306_WHITE);

    sDisplay.display();
    sFrame++;
  }
}
