#pragma once
#include <cstdint>

namespace oled
{
  bool init();
  void feedVolume(uint8_t vol);
  void drawNekoFrame();
}
