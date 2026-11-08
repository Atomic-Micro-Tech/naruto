/* 800160fc */

int FUN_800160fc(uint param_1,int param_2,uint param_3)

{
  if ((0xc < param_1) || (9 < param_2)) {
    return -2;
  }
  if (*(int *)(&UNK_8005693c + param_2 * 0x1c + param_1 * 0x118) != -1) {
    do {
      if (((int)*(short *)(&UNK_8005694c + param_2 * 0x1c + param_1 * 0x118) & param_3 & 0xff) ==
          (param_3 & 0xff)) {
        return param_2;
      }
      param_2 = param_2 + 1;
    } while ((param_2 < 10) && (*(int *)(&UNK_8005693c + param_2 * 0x1c + param_1 * 0x118) != -1));
  }
  return -1;
}


/* 800161e8 */

int FUN_800161e8(uint param_1,undefined1 param_2)

{
  int iVar1;
  int iVar2;
  int iVar3;
  
  if (param_1 < 0xd) {
    iVar1 = 0;
    iVar2 = 0;
    while( true ) {
      iVar3 = FUN_800160fc(param_1,iVar2,param_2);
      iVar2 = iVar3 + 1;
      if (iVar3 < 0) break;
      iVar1 = iVar1 + 1;
    }
  }
  else {
    iVar1 = 0;
  }
  return iVar1;
}


/* 80014404 */

undefined1 FUN_80014404(uint param_1,uint param_2)

{
  if ((param_1 < 4) && (param_2 < 4)) {
    return *(undefined1 *)((int)&DAT_80070eb0 + param_2 + param_1 * 0xb4);
  }
  return 0xe;
}


/* 80016a60 */

undefined1 FUN_80016a60(uint param_1)

{
  if ((param_1 & 0xff) < 4) {
    return (&DAT_80070f54)[(param_1 & 0xff) * 0xb4];
  }
  return 0;
}


