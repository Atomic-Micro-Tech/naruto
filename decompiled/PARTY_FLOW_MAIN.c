/* 80012904 */

/* Possible GS_125.OBJ/GsGetWorkBase
   Possible SSVM_2.OBJ/SsGetVoiceMask */

undefined4 FUN_80012904(void)

{
  return DAT_80070730;
}


/* 80012934 */

/* Possible S_003.OBJ/CdStatus
   Possible S_004.OBJ/CdMode
   Possible S_005.OBJ/CdLastCom */

undefined1 FUN_80012934(void)

{
  return DAT_8007073e;
}


/* 80012c20 */

void FUN_80012c20(void)

{
  if (DAT_80070cf4 != -1) {
    DAT_80070cf4 = DAT_80070cf4 + 1;
  }
  return;
}


/* 80017034 */

undefined4 FUN_80017034(uint param_1,undefined1 *param_2)

{
  undefined1 uVar1;
  bool bVar2;
  uint uVar3;
  undefined4 uVar4;
  undefined1 *puVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  int iVar9;
  
  param_1 = param_1 & 0xff;
  uVar3 = func_0x800135e0();
  uVar4 = 0;
  if (param_1 <= uVar3) {
    iVar8 = 0;
    if (param_1 != 0) {
      puVar5 = param_2;
      do {
        *puVar5 = (char)iVar8;
        iVar8 = iVar8 + 1;
        puVar5 = param_2 + iVar8;
      } while (iVar8 < (int)param_1);
    }
    iVar8 = 0;
    if (param_1 != 0) {
      bVar2 = 0 < (int)(param_1 - 1);
      do {
        if (bVar2) {
          puVar5 = param_2 + iVar8;
          iVar9 = iVar8;
          do {
            iVar6 = func_0x800138ec(*puVar5);
            iVar7 = func_0x800138ec(param_2[iVar9 + 1]);
            if (iVar6 < iVar7) {
              uVar1 = *puVar5;
              *puVar5 = param_2[iVar9 + 1];
              param_2[iVar9 + 1] = uVar1;
            }
            iVar9 = iVar9 + 1;
          } while (iVar9 < (int)(param_1 - 1));
        }
        iVar8 = iVar8 + 1;
        bVar2 = iVar8 < (int)(param_1 - 1);
      } while (iVar8 < (int)param_1);
    }
    uVar4 = 1;
  }
  return uVar4;
}


/* 80019f38 */

void FUN_80019f38(void)

{
  memset(&DAT_80089d60,'\0',0x54);
  DAT_80089d9c = 1;
  return;
}


/* 8001387c */

undefined4 FUN_8001387c(uint param_1,int param_2)

{
  if (3 < param_1) {
    return 0;
  }
  if (param_2 < 100000) {
    if (param_2 < -9999) {
      param_2 = -9999;
    }
  }
  else {
    param_2 = 99999;
  }
  (&DAT_80070eb8)[param_1 * 0x2d] = param_2;
  return 1;
}


/* 80012a70 */

/* Possible GS_125.OBJ/GsGetWorkBase
   Possible SSVM_2.OBJ/SsGetVoiceMask */

undefined4 FUN_80012a70(void)

{
  return DAT_80070c84;
}
