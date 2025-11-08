import { FIREBASE_DB_URL } from './firebaseConfig.js';
import { Item } from './item.js';

function usingFirebase(){ return typeof FIREBASE_DB_URL === 'string' && FIREBASE_DB_URL.trim().length > 0; }
const LS_KEY = 'tg_items';

export class ItemService {
  constructor(){
    this.baseUrl = usingFirebase() ? (FIREBASE_DB_URL.endsWith('/items') ? FIREBASE_DB_URL : FIREBASE_DB_URL + '/items') : null;
  }

  _lsAll(){
    try{ return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
  }
  _lsSave(arr){ localStorage.setItem(LS_KEY, JSON.stringify(arr)); }
  _genId(){ return Math.random().toString(36).slice(2,10); }

  async fetchItems(){
    if (usingFirebase()){
      const res = await fetch(`${this.baseUrl}.json`);
      if (!res.ok) throw new Error('Falha ao carregar dados do Firebase');
      const data = await res.json();
      const arr = data ? Object.entries(data).map(([id, v]) => new Item(id, v.titulo, v.descricao, v.categoria, v.imagem, v.pais, v.ano)) : [];
      return arr;
    } else {
      return this._lsAll().map(o => new Item(o.id, o.titulo, o.descricao, o.categoria, o.imagem, o.pais, o.ano));
    }
  }

  async addItem(item){
    if (usingFirebase()){
      const res = await fetch(`${this.baseUrl}.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!res.ok) throw new Error('Falha ao adicionar no Firebase');
      const data = await res.json();
      return { name: data.name };
    } else {
      const arr = this._lsAll();
      const id = this._genId();
      arr.push({ id, ...item });
      this._lsSave(arr);
      return { name: id };
    }
  }

  async removeItem(id){
    if (usingFirebase()){
      const res = await fetch(`${this.baseUrl}/${id}.json`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao remover no Firebase');
    } else {
      const arr = this._lsAll().filter(x => x.id !== id);
      this._lsSave(arr);
    }
  }

  async updateItem(id, item){
    if (usingFirebase()){
      const res = await fetch(`${this.baseUrl}/${id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!res.ok) throw new Error('Falha ao atualizar no Firebase');
    } else {
      const arr = this._lsAll();
      const idx = arr.findIndex(x => x.id == id);
      if (idx >= 0){
        arr[idx] = { id, ...item };
        this._lsSave(arr);
      }
    }
  }

  async seedIfEmpty(){
    const existing = await this.fetchItems();
    if (existing && existing.length) return false;
    const samples = [
      new Item(null, 'Praia do Forte', 'Mar calmo e águas claras', 'Praia', 'https://picsum.photos/seed/praia/800/600', 'Brasil', 2023),
      new Item(null, 'Sevilha', 'Centro histórico e Plaza de España', 'Cidade', 'https://picsum.photos/seed/sevilha/800/600', 'Espanha', 2022),
      new Item(null, 'Chiang Rai', 'Templo Branco e cafés de jardim', 'Cultural', 'https://picsum.photos/seed/chiangrai/800/600', 'Tailândia', 2024)
    ];
    for (const s of samples){
      await this.addItem({ titulo: s.titulo, descricao: s.descricao, categoria: s.categoria, imagem: s.imagem, pais: s.pais, ano: s.ano });
    }
    return true;
  }
}
