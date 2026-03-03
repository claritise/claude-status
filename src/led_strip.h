#pragma once
#include <cstdint>

namespace led
{
  void init();
  void setActive(bool on);
  void tick();
}
