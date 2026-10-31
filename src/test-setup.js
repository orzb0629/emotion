import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { JSDOM } from 'jsdom';
// Node 26의 전역 저장소 대신 실제 jsdom Storage를 사용합니다.
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:new JSDOM('',{url:'http://localhost/'}).window.localStorage});
HTMLDialogElement.prototype.showModal = function(){ this.setAttribute('open',''); };
HTMLDialogElement.prototype.close = function(){ this.removeAttribute('open'); };
Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn().mockResolvedValue(undefined)}});
