/**
 * Holiday look. The whole site turns festive from SEASON_START to SEASON_END
 * (Pacific time) with no deploy needed: an inline script in <head> sets
 * <html data-season="navidad"> before the page paints, and CSS shows the
 * decorations only then. Pages stay static.
 *
 * Preview any day:  ?temporada=navidad   Turn off:  ?temporada=normal
 * (remembered for the browser tab; ?temporada=auto goes back to the calendar)
 * The first page of each visit opens with the "lights on" curtain; ?intro=1 replays it.
 */
export const SEASON_START = { month: 11, day: 15 }; // Nov 15
export const SEASON_END = { month: 1, day: 6 }; // through Día de Reyes, Jan 6

export function isNavidad(d = new Date()) {
  const pt = new Date(d.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const m = pt.getMonth() + 1;
  const day = pt.getDate();
  if (m === SEASON_START.month) return day >= SEASON_START.day;
  if (m === 12) return true;
  if (m === SEASON_END.month) return day <= SEASON_END.day;
  return false;
}

/** Runs in <head> before paint, so there's no flash of the plain look */
export const seasonScript = `(function(){try{
var q=new URLSearchParams(location.search).get('temporada');
if(q==='auto'){sessionStorage.removeItem('rx-temporada');q=null}
if(q){sessionStorage.setItem('rx-temporada',q)}else{q=sessionStorage.getItem('rx-temporada')}
var on;
if(q==='navidad'){on=true}else if(q==='normal'){on=false}else{
var pt=new Date(new Date().toLocaleString('en-US',{timeZone:'America/Los_Angeles'}));
var m=pt.getMonth()+1,d=pt.getDate();
on=(m===${SEASON_START.month}&&d>=${SEASON_START.day})||m===12||(m===${SEASON_END.month}&&d<=${SEASON_END.day});}
if(on){var h=document.documentElement;h.setAttribute('data-season','navidad');
var iq=new URLSearchParams(location.search).get('intro');
if(iq==='1'||(!sessionStorage.getItem('rx-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&location.pathname.indexOf('/pedido/gracias')!==0))h.setAttribute('data-intro','1');}
}catch(e){}})();`;

/** Days left until Christmas Day (Pacific), 0 on the day itself */
export function daysToChristmas(d = new Date()) {
  const pt = new Date(d.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const today = new Date(pt.getFullYear(), pt.getMonth(), pt.getDate());
  let xmas = new Date(pt.getFullYear(), 11, 25);
  if (today > xmas) xmas = new Date(pt.getFullYear() + 1, 11, 25);
  return Math.round((xmas.getTime() - today.getTime()) / 86400000);
}
