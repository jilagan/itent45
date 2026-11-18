/* Memory budget model shared by the Server memory and Server capacity lessons.
   MEM is the state the sliders change. memModel() turns it into MB used and workers that fit. */
const MEM={ram:2048, workers:8, per:90, inflight:8, db:true, preload:false};
const OS_MB=350, NGINX_MB=20, HEADROOM=0.15;
function memModel(){
  const dbMB = MEM.db ? Math.min(1024, Math.max(256, Math.round(MEM.ram*0.2))) : 0;
  // preloading forks after import, so code pages are shared until written to
  const perW = MEM.preload ? Math.round(MEM.per*0.62) : MEM.per;
  const shared = MEM.preload ? Math.round(MEM.per*0.38) : 0;
  const workers = MEM.workers*perW + shared;
  const reqs = MEM.workers*MEM.inflight;      // one in-flight request per worker
  const used = OS_MB + NGINX_MB + dbMB + workers + reqs;
  const safe = MEM.ram*(1-HEADROOM);
  const budget = safe - OS_MB - NGINX_MB - dbMB - shared;
  const maxW = Math.max(0, Math.floor(budget/(perW+MEM.inflight)));
  return {dbMB, perW, shared, workers, reqs, used, safe, maxW,
          free: MEM.ram-used, over: used>MEM.ram, tight: used>safe};
}
