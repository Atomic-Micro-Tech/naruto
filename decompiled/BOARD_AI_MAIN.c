/* 800169a4 */

undefined1 FUN_800169a4(uint param_1)

{
  if ((param_1 & 0xff) < 4) {
    return *(undefined1 *)((int)&DAT_80070f50 + (param_1 & 0xff) * 0xb4 + 3);
  }
  return 0;
}


/* 80016464 */

undefined1 FUN_80016464(uint param_1)

{
  if ((param_1 & 0xff) < 4) {
    return *(undefined1 *)(&DAT_80070f4c + (param_1 & 0xff) * 0x2d);
  }
  return 0;
}


/* 80016524 */

undefined1 FUN_80016524(uint param_1)

{
  if ((param_1 & 0xff) < 4) {
    return *(undefined1 *)((int)&DAT_80070f4c + (param_1 & 0xff) * 0xb4 + 1);
  }
  return 0;
}


/* 800166a4 */

undefined1 FUN_800166a4(uint param_1)

{
  if ((param_1 & 0xff) < 4) {
    return *(undefined1 *)((int)&DAT_80070f4c + (param_1 & 0xff) * 0xb4 + 3);
  }
  return 0;
}


/* 80016764 */

undefined1 FUN_80016764(uint param_1)

{
  if ((param_1 & 0xff) < 4) {
    return *(undefined1 *)(&DAT_80070f50 + (param_1 & 0xff) * 0x2d);
  }
  return 0;
}


/* 800163a4 */

undefined1 FUN_800163a4(uint param_1)

{
  if ((param_1 & 0xff) < 4) {
    return *(undefined1 *)((int)&DAT_80070f48 + (param_1 & 0xff) * 0xb4 + 3);
  }
  return 0;
}


/* 800162e4 */

undefined1 FUN_800162e4(uint param_1)

{
  if ((param_1 & 0xff) < 4) {
    return *(undefined1 *)((int)&DAT_80070f48 + (param_1 & 0xff) * 0xb4 + 2);
  }
  return 0;
}


/* 8001a18c */

/* Possible GS_125.OBJ/GsGetWorkBase
   Possible SSVM_2.OBJ/SsGetVoiceMask */

undefined4 FUN_8001a18c(void)

{
  return DAT_80089d9c;
}


/* 8001a174 */

undefined4 FUN_8001a174(void)

{
  return 0;
}


