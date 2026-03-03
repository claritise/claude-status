#pragma once
#include <cstdint>

namespace oled
{
  enum Anim : uint8_t { IDLE, RUNNING, TYPING };

  bool init();
  void setAnim(Anim a);
  void drawFrame();
}
