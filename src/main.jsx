import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { characters, categories, subcategories, popularIds } from './characters';
import './style.css';

const KEY = 'character-picker-v1';
function readSaved() {
 try {
  const s = JSON.parse(localStorage.getItem(KEY)) || {};
  return { favorites: Array.isArray(s.favorites) ? s.favorites.filter(x=>typeof x==='string') : [], recent: Array.isArray(s.recent) ? s.recent.filter(x=>typeof x==='string').slice(0,20) : [], custom: Array.isArray(s.custom) ? s.custom.filter(x=>x && typeof x.id==='string' && typeof x.text==='string' && x.text.length<=80 && x.category==='내 문자') : [] };
 } catch { return { favorites: [], recent: [], custom: [] }; }
}
export function App() {
 const [saved,setSaved] = useState(readSaved);
 const [view,setView] = useState('전체');
 const [sub,setSub] = useState('전체');
 const [query,setQuery] = useState('');
 const [notice,setNotice] = useState('');
 const [storageError,setStorageError] = useState(false);
 const [adding,setAdding] = useState(false);
 const [input,setInput] = useState('');
 const [formError,setFormError] = useState('');
 const [manual,setManual] = useState(null);
 const timer = useRef();
 const dialog = useRef();
 const all = [...characters,...saved.custom];
 useEffect(()=>{try { localStorage.setItem(KEY,JSON.stringify(saved)); setStorageError(false); } catch {setStorageError(true);}},[saved]);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 useEffect(()=>{if(adding || manual!==null) dialog.current?.showModal(); else dialog.current?.close();},[adding,manual]);
 function flash(message) { setNotice(message); clearTimeout(timer.current); timer.current=setTimeout(()=>setNotice(''),1800); }
 function record(item) {setSaved(s=>({...s,recent:[item.id,...s.recent.filter(id=>id!==item.id)].slice(0,20)}));}
 async function copy(item) {
  try {await navigator.clipboard.writeText(item.text); record(item); flash('복사 완료!');}
  catch {setManual(item);}
 }
 function favorite(item) {setSaved(s=>({...s,favorites:s.favorites.includes(item.id)?s.favorites.filter(id=>id!==item.id):[...s.favorites,item.id]}));}
 function remove(item) {setSaved(s=>({...s,custom:s.custom.filter(x=>x.id!==item.id),favorites:s.favorites.filter(id=>id!==item.id),recent:s.recent.filter(id=>id!==item.id)}));flash('문자를 삭제했어요.');}
 function select(value) {setView(value);setSub('전체');}
 function add(e) {
  e.preventDefault(); const text=input.trim();
  if(!text || /[\p{L}\p{N}]/u.test(text.replace(/[\u1100-\u11FF\u3130-\u318F\u3040-\u30FF\u00C0-\u02FF\u1D00-\u1DBF]/g,'')) || /[\r\n\u0000-\u001F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/.test(text)) {setFormError('문장 없이, 한 줄의 이모티콘이나 특수문자만 입력해 주세요.');return;}
  if(all.some(x=>x.text===text)) {setFormError('이미 있는 문자예요. 검색해서 찾아보세요.');return;}
  setSaved(s=>({...s,custom:[...s.custom,{id:crypto.randomUUID(),text,category:'내 문자',subcategory:'직접 추가'}]}));
  setInput('');setFormError('');setAdding(false);select('내 문자');setQuery('');flash('내 문자에 추가했어요.');
 }
 function cards(items, empty) {return items.length ? <div className="grid">{items.map(item=><article className="card" key={item.id}>
  <button className="copy" onClick={()=>copy(item)} aria-label={`${item.text} 복사`}><span className="glyph" style={{fontSize:item.text.length>22?'1.1rem':undefined}}>{item.text}</span><span className="card-label">{item.subcategory}<span className="copy-hint">클릭하여 복사 ↗</span></span></button>
  <button className={`favorite ${saved.favorites.includes(item.id)?'selected':''}`} aria-label={`${item.text} 즐겨찾기 ${saved.favorites.includes(item.id)?'해제':'추가'}`} aria-pressed={saved.favorites.includes(item.id)} onClick={()=>favorite(item)}>{saved.favorites.includes(item.id)?'★':'☆'}</button>
  {item.category==='내 문자' && <button className="delete" aria-label={`${item.text} 삭제`} onClick={()=>remove(item)}>삭제</button>}
 </article>)}</div> : <div className="empty">{empty}</div>;}
 let items = view==='즐겨찾기' ? saved.favorites.map(id=>all.find(x=>x.id===id)).filter(Boolean) : view==='최근 사용' ? saved.recent.map(id=>all.find(x=>x.id===id)).filter(Boolean) : all.filter(x=>view==='전체'||x.category===view);
 items=items.filter(x=>(sub==='전체'||x.subcategory===sub)&&`${x.text} ${x.category} ${x.subcategory}`.includes(query.trim()));
 return <><header><div className="brand-mark">✳</div><div><h1>특수문자 입력기</h1><p>작은 문자로 더 다정하게</p></div><span className="privacy">로그인 없이 · 광고 없이</span></header>
 <div className="layout"><aside><span className="nav-caption">MY COLLECTION</span><nav aria-label="카테고리">{['전체','즐겨찾기','최근 사용','내 문자'].map((v,i)=><button key={v} className={view===v?'active':''} onClick={()=>select(v)}><span>{['▦','☆','◷','＋'][i]}</span>{v}<small>{v==='즐겨찾기'?saved.favorites.length:v==='최근 사용'?saved.recent.length:v==='내 문자'?saved.custom.length:all.length}</small></button>)}<span className="nav-caption category-caption">CATEGORIES</span>{categories.map((v,i)=><button key={v} className={view===v?'active':''} onClick={()=>select(v)}><span>{['☺','✧','୨୧'][i]}</span>{v}</button>)}</nav><div className="aside-note">마음에 드는 문자는 ☆<br/>다음에도 여기서 만나요.</div></aside>
 <main><div className="intro"><div><span className="eyebrow">COPY A LITTLE HAPPINESS</span><h2>마음을 전하는 작은 기호들<span>✦</span></h2><p>마음에 드는 문자를 클릭하고, 메신저에 붙여 넣으세요.</p></div><button className="add-button" onClick={()=>{setAdding(true);setFormError('');}}>＋ 내 문자 추가</button></div>
 {storageError && <p role="alert" className="warning">브라우저 저장 공간을 사용할 수 없어 변경 사항이 새로고침 후 사라질 수 있어요.</p>}
 {view==='전체' && !query && <><section><div className="section-heading"><h3>자주 쓰는 문자 <span>✧</span></h3><span>가볍게 꺼내 쓰세요</span></div>{cards(popularIds.map(id=>characters.find(x=>x.id===id)))}</section><section><div className="section-heading"><h3>내 즐겨찾기 <span>☆</span></h3><button className="text-button" onClick={()=>select('즐겨찾기')}>전체 보기 →</button></div>{cards(saved.favorites.slice(0,4).map(id=>all.find(x=>x.id===id)).filter(Boolean),'카드의 ☆를 누르면 자주 쓰는 문자를 이곳에 모을 수 있어요.')}</section></>}
 <section className="collection"><div className="section-heading"><h3>{view==='전체'?'모든 문자':view} <span className="count">{items.length}</span></h3>{view==='최근 사용' && <span>최근 복사한 20개</span>}</div>
 <div className="search-wrap"><span aria-hidden="true">⌕</span><input aria-label="문자 검색" placeholder="웃음, 하트, 응원… 어떤 문자를 찾으세요?" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="검색어 지우기" onClick={()=>setQuery('')}>×</button>}</div>
 {subcategories[view] && <div className="chips" aria-label="세부 카테고리">{['전체',...subcategories[view]].map(s=><button className={sub===s?'active':''} aria-pressed={sub===s} key={s} onClick={()=>setSub(s)}>{s}</button>)}</div>}
 {cards(items,query?'검색 결과가 없어요. 다른 문자나 카테고리로 찾아보세요.':view==='즐겨찾기'?'카드의 ☆를 눌러 즐겨찾기를 추가해 보세요.':view==='최근 사용'?'문자를 복사하면 이곳에 최근 사용 기록이 생겨요.':'아직 내 문자가 없어요. 위의 추가 버튼으로 등록해 보세요.')}</section>
 <footer><span>✧ 나만의 작은 문자 서랍</span><p>즐겨찾기와 기록은 이 브라우저에만 저장돼요.<br/>문자의 모양은 메신저와 글꼴에 따라 조금 달라질 수 있어요.</p></footer></main></div>
 <div className={`toast ${notice?'visible':''}`} role="status" aria-live="polite">{notice}</div>
 <dialog ref={dialog} onCancel={()=>{setAdding(false);setManual(null);}} onClick={e=>{if(e.target===dialog.current){setAdding(false);setManual(null);}}}>
 {adding?<form onSubmit={add}><div className="section-heading"><h3>내 문자 추가</h3><button type="button" aria-label="닫기" onClick={()=>setAdding(false)}>×</button></div><p>자주 쓰는 이모티콘이나 특수문자를 한 줄로 넣어 주세요.</p><label htmlFor="custom">이모티콘 · 특수문자</label><input id="custom" autoFocus maxLength={80} value={input} onChange={e=>setInput(e.target.value)} placeholder="( ˶ˆᗜˆ˵ )"/><p className="helper">최대 80자 · 문장과 일반 글자는 등록할 수 없어요.</p>{formError&&<p role="alert" className="error">{formError}</p>}<button className="add-button" type="submit">추가하기</button></form>:manual && <div><h3>직접 복사해 주세요</h3><p>자동 복사를 사용할 수 없어요. 아래 문자를 선택한 뒤<br/>Ctrl+C (Mac: ⌘C), 모바일에서는 길게 눌러 복사하세요.</p><textarea aria-label="수동 복사할 문자" readOnly value={manual.text} onFocus={e=>e.target.select()}/><button className="add-button" onClick={()=>{record(manual);setManual(null);}}>복사했어요</button><button className="text-button" onClick={()=>setManual(null)}>닫기</button></div>}
 </dialog></>;
}
if (document.getElementById('root')) createRoot(document.getElementById('root')).render(<App/>);
