#pragma once
#include <cstdint>

namespace led
{
  void init();
  void setPixel(uint16_t index, uint8_t r, uint8_t g, uint8_t b);
  void clear();
  void show();
  uint16_t count();
  void hsvToRgb(uint16_t h, uint8_t s, uint8_t v,
                uint8_t &r, uint8_t &g, uint8_t &b);
}
