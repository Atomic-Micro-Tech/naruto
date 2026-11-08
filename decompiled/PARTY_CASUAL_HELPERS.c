/* 8001a19c */

undefined4 FUN_8001a19c(undefined1 param_1,undefined1 param_2,undefined1 param_3,undefined1 param_4)

{
  UNK_80089da0 = param_1;
  UNK_80089da1 = param_2;
  UNK_80089da2 = param_3;
  UNK_80089da3 = param_4;
  return 1;
}


/* 8001a1bc */

undefined1 FUN_8001a1bc(uint param_1)

{
  if (param_1 < 4) {
    return (&UNK_80089da0)[param_1];
  }
  return 0;
}


/* 8001a1e4 */

void FUN_8001a1e4(undefined1 param_1)

{
  UNK_80089da4 = param_1;
  return;
}


/* 8001a1f0 */

/* Possible S_003.OBJ/CdStatus
   Possible S_004.OBJ/CdMode
   Possible S_005.OBJ/CdLastCom */

undefined1 FUN_8001a1f0(void)

{
  return UNK_80089da4;
}


/* 8001a250 */

undefined4 FUN_8001a250(byte param_1)

{
  if (param_1 < 0xd) {
    UNK_80089da5 = param_1;
    return 1;
  }
  return 0;
}


/* 8001a274 */

/* Possible S_003.OBJ/CdStatus
   Possible S_004.OBJ/CdMode
   Possible S_005.OBJ/CdLastCom */

undefined1 FUN_8001a274(void)

{
  return UNK_80089da5;
}


/* 80013610 */

/* Possible S_003.OBJ/CdStatus
   Possible S_004.OBJ/CdMode
   Possible S_005.OBJ/CdLastCom */

undefined1 FUN_80013610(void)

{
  return UNK_80070ea1;
}


/* 80013e48 */

undefined1 FUN_80013e48(uint param_1)

{
  if (param_1 < 4) {
    return (&UNK_80070ec7)[param_1 * 0xb4];
  }
  return 0;
}


/* 8001a2c8 */

void FUN_8001a2c8(undefined1 param_1)

{
  UNK_80089da8 = param_1;
  return;
}


/* 800150cc */

undefined4 FUN_800150cc(uint param_1,uint param_2)

{
  short *psVar1;
  
  if ((3 < (param_1 & 0xff)) || (4 < (param_2 & 0xff))) {
    return 0;
  }
  psVar1 = (short *)(&UNK_80070f1e + (param_2 & 0xff) * 2 + (param_1 & 0xff) * 0xb4);
  if (*psVar1 != -1) {
    *psVar1 = *psVar1 + 1;
  }
  return 1;
}


/* 8001519c */

undefined2 FUN_8001519c(uint param_1,uint param_2)

{
  if (((param_1 & 0xff) < 4) && ((param_2 & 0xff) < 5)) {
    return *(undefined2 *)(&UNK_80070f1e + (param_2 & 0xff) * 2 + (param_1 & 0xff) * 0xb4);
  }
  return 0;
}


/* 80015234 */

undefined2 FUN_80015234(uint param_1)

{
  if ((param_1 & 0xff) < 4) {
    return *(undefined2 *)(&UNK_80070f2c + (param_1 & 0xff) * 0xb4);
  }
  return 0;
}
