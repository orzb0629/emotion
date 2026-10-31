import React from 'react';
import { render, screen, fireEvent, within, cleanup, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { App } from './main';
import { characters, categories, subcategories } from './characters';
beforeEach(()=>{localStorage.clear();navigator.clipboard.writeText.mockReset().mockResolvedValue(undefined);});
afterEach(cleanup);
function nav(name){fireEvent.click(within(screen.getByRole('navigation')).getByRole('button',{name:new RegExp(name)}));}
test('기본 데이터는 100~150개의 고유 문자이며 모든 카테고리를 포함한다',()=>{
 expect(characters.length).toBeGreaterThanOrEqual(100);expect(characters.length).toBeLessThanOrEqual(150);
 expect(new Set(characters.map(x=>x.text)).size).toBe(characters.length);
 expect(characters.every(x=>!/[가-힣]{2,}/.test(x.text))).toBe(true);
 expect(categories).toHaveLength(3);expect(Object.values(subcategories).flat()).toHaveLength(22);
});
test('검색 및 세부 카테고리 탐색',()=>{
 render(<App/>);fireEvent.change(screen.getByRole('textbox',{name:'문자 검색'}),{target:{value:'하트'}});
 expect(screen.getAllByRole('button',{name:/ 복사$/})).toHaveLength(6);
 fireEvent.click(screen.getByRole('button',{name:'검색어 지우기'}));nav('얼굴 이모티콘');
 fireEvent.click(screen.getByRole('button',{name:'울음'}));expect(screen.getAllByRole('button',{name:/ 복사$/})).toHaveLength(5);
});
test('카드 클릭 복사와 최근 기록, 즐겨찾기 새로고침 유지',async()=>{
 const {unmount}=render(<App/>);fireEvent.click(screen.getAllByRole('button',{name:'♡ 복사'})[0]);
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('복사 완료!'));
 expect(navigator.clipboard.writeText).toHaveBeenCalledWith('♡');
 fireEvent.click(screen.getAllByRole('button',{name:'♡ 즐겨찾기 추가'})[0]);unmount();render(<App/>);
 nav('즐겨찾기');expect(screen.getByRole('button',{name:'♡ 복사'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'♡ 즐겨찾기 해제'}));expect(screen.queryByRole('button',{name:'♡ 복사'})).toBeNull();
 nav('최근 사용');expect(screen.getByRole('button',{name:'♡ 복사'})).toBeInTheDocument();
});
test('최근 기록은 중복 없이 최대 20개',async()=>{
 render(<App/>);nav('특수문자');
 for(const item of characters.filter(x=>x.category==='특수문자').slice(0,23)){
  fireEvent.click(screen.getByRole('button',{name:`${item.text} 복사`}));
  await waitFor(()=>expect(JSON.parse(localStorage.getItem('character-picker-v1')).recent[0]).toBe(item.id));
 }
 fireEvent.click(screen.getByRole('button',{name:'♡ 복사'}));
 await waitFor(()=>expect(JSON.parse(localStorage.getItem('character-picker-v1')).recent[0]).toBe('base-10-0'));
 nav('최근 사용');expect(screen.getAllByRole('button',{name:/ 복사$/})).toHaveLength(20);
});
test('사용자 문자 추가, 저장, 중복 및 문장 거부, 삭제',()=>{
 const {unmount}=render(<App/>);fireEvent.click(screen.getByRole('button',{name:'＋ 내 문자 추가'}));
 const field=screen.getByLabelText('이모티콘 · 특수문자');fireEvent.change(field,{target:{value:'안녕하세요'}});
 fireEvent.click(screen.getByRole('button',{name:'추가하기'}));expect(screen.getByRole('alert')).toBeInTheDocument();
 fireEvent.change(field,{target:{value:'♡'}});fireEvent.click(screen.getByRole('button',{name:'추가하기'}));expect(screen.getByRole('alert')).toHaveTextContent('이미 있는');
 fireEvent.change(field,{target:{value:'✧♡✧'}});fireEvent.click(screen.getByRole('button',{name:'추가하기'}));
 expect(screen.getByRole('button',{name:'✧♡✧ 복사'})).toBeInTheDocument();unmount();render(<App/>);nav('내 문자');
 expect(screen.getByRole('button',{name:'✧♡✧ 복사'})).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'✧♡✧ 삭제'}));expect(screen.queryByRole('button',{name:'✧♡✧ 복사'})).toBeNull();
});
test('클립보드 실패 시 수동 복사 안내',async()=>{
 navigator.clipboard.writeText.mockRejectedValue(new Error('denied'));render(<App/>);
 fireEvent.click(screen.getAllByRole('button',{name:'♡ 복사'})[0]);
 expect(await screen.findByRole('heading',{name:'직접 복사해 주세요'})).toBeInTheDocument();
 expect(screen.getByRole('textbox',{name:'수동 복사할 문자'})).toHaveValue('♡');
 expect(JSON.parse(localStorage.getItem('character-picker-v1')).recent).toHaveLength(0);
});
test('손상된 저장 데이터에서도 실행된다',()=>{
 localStorage.setItem('character-picker-v1','{broken');render(<App/>);expect(screen.getByRole('heading',{name:'특수문자 입력기'})).toBeInTheDocument();
});
