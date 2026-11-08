/* Offline XA-ADPCM sample decoder. This does not execute PS1 game code.
 * Sound-group layout: PSX-SPX CDROM Format (XA ADPCM).
 * Arithmetic mode0 uses separately truncated predictor products, as observed
 * in DuckStation's CDROM decoder; mode1 supports FFmpeg comparison rounding.
 */
#include <stdint.h>
static int floor64(int v) { return v>=0?v/64:-((-v+63)/64); }
int decode_xa(const uint8_t *input, int length, int stereo, int bits,
              int32_t *history, int16_t *output, int arithmetic) {
    const int positive[4]={0,60,115,98},negative[4]={0,0,-52,-55};
    if(length!=2304 || (stereo!=0&&stereo!=1) || (bits!=4&&bits!=8))return -1;
    const int units=32/bits, pergroup=28*units;
    for(int g=0;g<18;g++){
        const uint8_t *block=input+g*128;
        for(int u=0;u<units;u++){
            int predictor=block[4+u]>>4,shift=block[4+u]&15;
            if(predictor>3)return -(2+g*units+u);
            if(shift>12)shift=9;
            const int channel=stereo?(u&1):0;
            int old=history[channel*2],older=history[channel*2+1];
            for(int j=0;j<28;j++){
                int value;
                if(bits==4){int byte=block[16+j*4+u/2];value=(byte>>((u&1)*4))&15;if(value>=8)value-=16;value*=4096;}
                else {value=(int8_t)block[16+j*4+u];value*=256;}
                /* Equivalent to arithmetic right shift, including negatives. */
                value=value>=0?value/(1<<shift):-((-value+(1<<shift)-1)/(1<<shift));
                const int a=old*positive[predictor],b=older*negative[predictor];
                value+=arithmetic?floor64(a+b+32):floor64(a)+floor64(b);
                if(value>32767)value=32767;else if(value<-32768)value=-32768;
                int position=g*pergroup+(stereo?(u/2)*56+j*2+channel:u*28+j);
                output[position]=(int16_t)value;older=old;old=value;
            }
            history[channel*2]=old;history[channel*2+1]=older;
        }
    }
    return 18*pergroup;
}
