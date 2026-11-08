/* 8011c680 */

void FUN_8011c680(void)

{
  byte bVar1;
  int iVar2;
  undefined4 uVar3;
  uint uVar4;
  int iVar5;
  int iVar6;
  undefined4 *puVar7;
  int iVar8;
  undefined4 auStack_60 [6];
  byte abStack_48 [32];
  undefined2 auStack_28 [4];
  
  func_0x8001a058(auStack_60);
  func_0x8001a0c8(abStack_48 + 4);
  func_0x8001a15c(auStack_28);
  iVar8 = 0;
  iVar2 = 0;
  do {
    puVar7 = (undefined4 *)(iVar2 * 0x40 + iVar8 * 0x2c + 0x8440 + DAT_8013a8cc);
    *puVar7 = auStack_60[iVar8 * 7];
    puVar7[1] = auStack_60[iVar8 * 7 + 2];
    puVar7[2] = auStack_60[iVar8 * 7 + 1];
    puVar7[3] = auStack_60[iVar8 * 7 + 3];
    *(undefined2 *)((int)puVar7 + 0x12) = 0xffff;
    *(undefined2 *)(puVar7 + 5) = 0;
    *(undefined2 *)((int)puVar7 + 0x16) = 0;
    *(undefined1 *)(puVar7 + 6) = 0;
    *(undefined2 *)(puVar7 + 7) = 0;
    *(undefined2 *)((int)puVar7 + 0x1e) = 0;
    uVar3 = func_0x80013660();
    *(undefined4 *)(DAT_8013a8cc + 0x85e0 + iVar8 * 4) = uVar3;
    uVar4 = func_0x80013dc4(auStack_60[iVar8 * 7]);
    if ((uVar4 & 0x20) == 0) {
      puVar7[1] = puVar7[1] & 0xffffffbf;
    }
    else {
      puVar7[1] = puVar7[1] | 0x40;
      func_0x80013620(*puVar7,1);
    }
    bVar1 = abStack_48[iVar8 * 0x1c];
    uVar4 = func_0x800154d4();
    if (uVar4 <= bVar1) goto LAB_8011c8d0;
    iVar2 = func_0x800154e0(abStack_48[iVar8 * 0x1c]);
    if ((iVar2 == 8) && (iVar8 == 0)) {
      uVar4 = puVar7[1] | 2;
LAB_8011c8c4:
      puVar7[1] = uVar4;
    }
    else {
      if ((iVar2 == 10) && (iVar8 == 1)) {
        uVar4 = puVar7[1] | 4;
        goto LAB_8011c8c4;
      }
      if ((iVar2 != 9) || (iVar8 != 0)) goto LAB_8011c8d0;
      iVar2 = func_0x8001552c(abStack_48[0]);
      if (iVar2 == 2) {
        uVar4 = puVar7[1] | 0x10;
        goto LAB_8011c8c4;
      }
      if (iVar2 < 3) {
        if (iVar2 == 1) {
          uVar4 = puVar7[1] | 8;
          goto LAB_8011c8c4;
        }
      }
      else if (iVar2 == 3) {
        uVar4 = puVar7[1] | 0x20;
        goto LAB_8011c8c4;
      }
    }
LAB_8011c8d0:
    iVar6 = 0;
    iVar2 = 0;
    do {
      iVar2 = iVar2 - iVar6;
      iVar5 = iVar2 * 4;
      puVar7[iVar2 + 8] = 0xffffffff;
      puVar7[iVar2 + 9] = 0;
      *(undefined2 *)(puVar7 + iVar2 + 10) = 0;
      *(undefined2 *)((int)puVar7 + iVar5 + 0x2a) = 0;
      *(undefined2 *)(puVar7 + iVar2 + 0xb) = 0;
      *(undefined2 *)((int)puVar7 + iVar5 + 0x2e) = 0;
      *(undefined2 *)(puVar7 + iVar2 + 0xc) = 0;
      *(undefined2 *)((int)puVar7 + iVar5 + 0x32) = 0;
      iVar6 = iVar6 + 1;
      iVar2 = iVar6 * 8;
    } while (iVar6 < 4);
    *(undefined2 *)(puVar7 + 4) = auStack_28[0];
    iVar2 = 0;
    do {
      if (iVar8 == 0) {
        iVar6 = func_0x80015d24(puVar7[2],iVar2,puVar7 + iVar2 * 7 + 8);
      }
      else {
        iVar6 = func_0x80015e84(puVar7[2],iVar2,puVar7 + iVar2 * 7 + 8);
      }
      if (iVar6 == 0) {
        iVar6 = iVar2 + -1;
        if (iVar8 == 1) {
          if (iVar6 == 1) {
            bVar1 = *(byte *)(puVar7 + 6) & 0xfb;
LAB_8011c9fc:
            *(byte *)(puVar7 + 6) = bVar1;
          }
          else if (iVar6 < 2) {
            if (iVar2 == 1) {
              bVar1 = *(byte *)(puVar7 + 6) & 0xfd;
              goto LAB_8011c9fc;
            }
          }
          else if (iVar6 == 2) {
            bVar1 = *(byte *)(puVar7 + 6) & 0xfe;
            goto LAB_8011c9fc;
          }
          *(byte *)(puVar7 + 6) = *(byte *)(puVar7 + 6) | 8;
        }
        *(short *)(puVar7 + 7) = (short)iVar2;
        iVar2 = 4;
      }
      else {
        func_0x8011ca60(puVar7,iVar2);
        iVar2 = iVar2 + 1;
        *(short *)(puVar7 + 7) = (short)iVar2;
      }
    } while (iVar2 < 4);
    iVar8 = iVar8 + 1;
    iVar2 = iVar8 * 2;
    if (1 < iVar8) {
      func_0x8011ccb8();
      return;
    }
  } while( true );
}


/* 8011c334 */

void FUN_8011c334(void)

{
  int iVar1;
  
  switch(*(undefined4 *)(DAT_8013a8cc + 0x85ec)) {
  case 10:
    *(undefined1 *)(DAT_8013a8cc + 0x842c) = 0xe8;
    *(undefined1 *)(DAT_8013a8cc + 0x842d) = 0xe8;
    *(undefined1 *)(DAT_8013a8cc + 0x842e) = 200;
    *(undefined1 *)(DAT_8013a8cc + 0x8430) = 0xe8;
    *(undefined1 *)(DAT_8013a8cc + 0x8431) = 0xe8;
    *(undefined1 *)(DAT_8013a8cc + 0x8432) = 200;
    iVar1 = DAT_8013a8cc;
    *(undefined2 *)(DAT_8013a8cc + 0x8438) = 0;
    *(undefined2 *)(iVar1 + 0x843a) = 1;
    *(undefined1 *)(iVar1 + 0x843c) = 0;
    FUN_8011fe74();
    break;
  default:
    *(undefined1 *)(DAT_8013a8cc + 0x842c) = 0xb4;
    *(undefined1 *)(DAT_8013a8cc + 0x842d) = 0x20;
    *(undefined1 *)(DAT_8013a8cc + 0x842e) = 6;
    *(undefined1 *)(DAT_8013a8cc + 0x8430) = 0xe8;
    *(undefined1 *)(DAT_8013a8cc + 0x8431) = 0xe8;
    *(undefined1 *)(DAT_8013a8cc + 0x8432) = 200;
    iVar1 = DAT_8013a8cc;
    *(undefined2 *)(DAT_8013a8cc + 0x8438) = 0;
    *(undefined2 *)(iVar1 + 0x843a) = 0x1e;
    *(undefined1 *)(iVar1 + 0x843c) = 10;
    FUN_8011fe74();
    break;
  case 0xc:
  case 0x1e:
    *(undefined1 *)(DAT_8013a8cc + 0x842c) = 0xff;
    *(undefined1 *)(DAT_8013a8cc + 0x842d) = 0xff;
    *(undefined1 *)(DAT_8013a8cc + 0x842e) = 0xff;
    goto LAB_8011c3f0;
  case 0x14:
    *(undefined1 *)(DAT_8013a8cc + 0x842c) = 0;
    *(undefined1 *)(DAT_8013a8cc + 0x842d) = 0;
    *(undefined1 *)(DAT_8013a8cc + 0x842e) = 0;
LAB_8011c3f0:
    *(undefined1 *)(DAT_8013a8cc + 0x8430) = 0xb4;
    *(undefined1 *)(DAT_8013a8cc + 0x8431) = 0x20;
    *(undefined1 *)(DAT_8013a8cc + 0x8432) = 6;
    iVar1 = DAT_8013a8cc;
    *(undefined2 *)(DAT_8013a8cc + 0x8438) = 0;
    *(undefined2 *)(iVar1 + 0x843a) = 0xf;
    *(undefined1 *)(iVar1 + 0x843c) = 10;
    break;
  case 0x3c:
    break;
  }
  return;
}


/* 80133758 */

void FUN_80133758(void)

{
  int iVar1;
  int iVar2;
  
  iVar2 = *(int *)(*DAT_8013b510 + 0x1098);
  if ((((*(int *)(iVar2 + 0x8448) == 9) || (*(int *)(iVar2 + 0x8448) == 0xc)) &&
      (iVar1 = *(int *)(*(int *)(*DAT_8013b510 + 0x1098) + 0x84f4), iVar1 != 0xb)) && (iVar1 != 8))
  {
    *(short *)(iVar2 + 0x845c) = *(short *)(iVar2 + 0x845c) + -1;
  }
  return;
}


/* 8011ca60 */

void FUN_8011ca60(int param_1,int param_2)

{
  byte bVar1;
  undefined2 uVar2;
  short sVar3;
  int iVar4;
  int iVar5;
  undefined8 uVar6;
  
  if ((*(uint *)(param_1 + 4) & 2) == 0) {
    if ((*(uint *)(param_1 + 4) & 4) != 0) {
      iVar5 = param_1 + param_2 * 0x1c;
      *(undefined2 *)(iVar5 + 0x28) = 0;
      *(undefined2 *)(iVar5 + 0x2a) = 0;
    }
  }
  else {
    iVar5 = param_1 + param_2 * 0x1c;
    uVar6 = func_0x800389f8((int)*(short *)(iVar5 + 0x28));
    uVar6 = func_0x80038e28((int)uVar6,(int)((ulonglong)uVar6 >> 0x20),0,0x3fe00000);
    uVar2 = func_0x80038848((int)uVar6,(int)((ulonglong)uVar6 >> 0x20));
    *(undefined2 *)(iVar5 + 0x28) = uVar2;
    uVar6 = func_0x800389f8((int)*(short *)(iVar5 + 0x2a));
    uVar6 = func_0x80038e28((int)uVar6,(int)((ulonglong)uVar6 >> 0x20),0,0x3fe00000);
    uVar2 = func_0x80038848((int)uVar6,(int)((ulonglong)uVar6 >> 0x20));
    *(undefined2 *)(iVar5 + 0x2a) = uVar2;
  }
  if ((*(uint *)(param_1 + 4) & 0x20) == 0) {
    if ((*(uint *)(param_1 + 4) & 0x10) == 0) {
      if ((*(uint *)(param_1 + 4) & 8) == 0) goto LAB_8011cbe0;
      iVar5 = param_1 + param_2 * 0x1c;
      *(short *)(iVar5 + 0x2c) = *(short *)(iVar5 + 0x2c) + 1;
      sVar3 = *(short *)(iVar5 + 0x2e) + 1;
    }
    else {
      iVar5 = param_1 + param_2 * 0x1c;
      *(short *)(iVar5 + 0x2c) = *(short *)(iVar5 + 0x2c) + 2;
      sVar3 = *(short *)(iVar5 + 0x2e) + 2;
    }
  }
  else {
    iVar5 = param_1 + param_2 * 0x1c;
    *(short *)(iVar5 + 0x2c) = *(short *)(iVar5 + 0x2c) + 3;
    sVar3 = *(short *)(iVar5 + 0x2e) + 3;
  }
  *(short *)(iVar5 + 0x2e) = sVar3;
LAB_8011cbe0:
  iVar5 = *(int *)(param_1 + 0xc);
  if (iVar5 < 0) {
    iVar5 = 0;
  }
  iVar4 = param_1 + param_2 * 0x1c;
  if (iVar5 < *(short *)(iVar4 + 0x28)) {
    *(ushort *)(iVar4 + 0x30) = *(ushort *)(iVar4 + 0x30) | 0x80;
  }
  else {
    if (param_2 == 1) {
      bVar1 = *(byte *)(param_1 + 0x18) | 4;
    }
    else if (param_2 < 2) {
      if (param_2 != 0) {
        return;
      }
      bVar1 = *(byte *)(param_1 + 0x18) | 2;
    }
    else if (param_2 == 2) {
      bVar1 = *(byte *)(param_1 + 0x18) | 1;
    }
    else {
      if (param_2 != 3) {
        return;
      }
      bVar1 = *(byte *)(param_1 + 0x18) | 8;
    }
    *(byte *)(param_1 + 0x18) = bVar1;
  }
  return;
}


/* 8011ccb8 */

void FUN_8011ccb8(void)

{
  short sVar1;
  int iVar2;
  byte bVar3;
  
  iVar2 = DAT_8013a8cc;
  if ((((*(int *)(DAT_8013a8cc + 0x8448) == 9) || (*(int *)(DAT_8013a8cc + 0x8448) == 0xc)) &&
      (*(int *)(DAT_8013a8cc + 0x84f4) != 0xb)) && (*(int *)(DAT_8013a8cc + 0x84f4) != 8)) {
    *(short *)(DAT_8013a8cc + 0x845c) = *(short *)(DAT_8013a8cc + 0x845c) + -1;
    sVar1 = *(short *)(iVar2 + 0x845c);
    if (sVar1 == 1) {
      bVar3 = *(byte *)(iVar2 + 0x8458) & 0xfb;
    }
    else if (sVar1 < 2) {
      if (sVar1 != 0) {
        return;
      }
      bVar3 = *(byte *)(iVar2 + 0x8458) & 0xfd;
    }
    else if (sVar1 == 2) {
      bVar3 = *(byte *)(iVar2 + 0x8458) & 0xfe;
    }
    else {
      if (sVar1 != 3) {
        return;
      }
      bVar3 = *(byte *)(iVar2 + 0x8458) & 0xf7;
    }
    *(byte *)(iVar2 + 0x8458) = bVar3;
  }
  return;
}


