import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api, sessionCache } from '@/api';
import type { Vocabulary, Grammar, Kanji } from '@/types';

type TabType = 'vocab' | 'grammar' | 'kanji';

export default function AdminPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Redirect if not admin
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<TabType>('vocab');
  const [loading, setLoading] = useState(false);

  // Data lists
  const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
  const [grammarList, setGrammarList] = useState<Grammar[]>([]);
  const [kanjiList, setKanjiList] = useState<Kanji[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Fields State
  // Vocab fields
  const [vocabJapanese, setVocabJapanese] = useState('');
  const [vocabHiragana, setVocabHiragana] = useState('');
  const [vocabMeaning, setVocabMeaning] = useState('');
  const [vocabExample, setVocabExample] = useState('');
  const [vocabLevel, setVocabLevel] = useState('N5');
  const [vocabLesson, setVocabLesson] = useState('');

  // Grammar fields
  const [grammarPattern, setGrammarPattern] = useState('');
  const [grammarMeaning, setGrammarMeaning] = useState('');
  const [grammarExplanation, setGrammarExplanation] = useState('');
  const [grammarExampleJa, setGrammarExampleJa] = useState('');
  const [grammarExampleVi, setGrammarExampleVi] = useState('');
  const [grammarNote, setGrammarNote] = useState('');
  const [grammarLevel, setGrammarLevel] = useState('N5');
  const [grammarLesson, setGrammarLesson] = useState('');
  const [grammarTextbook, setGrammarTextbook] = useState('');

  // Kanji fields
  const [kanjiChar, setKanjiChar] = useState('');
  const [kanjiMeaning, setKanjiMeaning] = useState('');
  const [kanjiOnyomi, setKanjiOnyomi] = useState('');
  const [kanjiKunyomi, setKanjiKunyomi] = useState('');
  const [kanjiStrokeCount, setKanjiStrokeCount] = useState('');
  const [kanjiLevel, setKanjiLevel] = useState('N5');
  const [kanjiLesson, setKanjiLesson] = useState('');

  // Delete Confirm Modal State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch Data & prevent race conditions
  useEffect(() => {
    let active = true;
    if (!isAdmin) return;

    const fetchTabDb = async () => {
      setLoading(true);
      try {
        if (activeTab === 'vocab') {
          const data = await api.getAllVocabulary();
          if (active) setVocabList(data);
        } else if (activeTab === 'grammar') {
          const data = await api.getAllGrammar();
          if (active) setGrammarList(data);
        } else if (activeTab === 'kanji') {
          const data = await api.getAllKanji();
          if (active) setKanjiList(data);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu';
        if (active) showToast(message, 'error');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTabDb();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset pagination on tab change
    setCurrentPage(1);
    setSearchQuery('');
    setLevelFilter('all');

    return () => {
      active = false;
    };
  }, [activeTab, user, refreshTrigger]);

  const handleCloseForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  // Reset form inputs
  const resetForm = () => {
    setEditingId(null);
    // Vocab
    setVocabJapanese('');
    setVocabHiragana('');
    setVocabMeaning('');
    setVocabExample('');
    setVocabLevel('N5');
    setVocabLesson('');
    // Grammar
    setGrammarPattern('');
    setGrammarMeaning('');
    setGrammarExplanation('');
    setGrammarExampleJa('');
    setGrammarExampleVi('');
    setGrammarNote('');
    setGrammarLevel('N5');
    setGrammarLesson('');
    setGrammarTextbook('');
    // Kanji
    setKanjiChar('');
    setKanjiMeaning('');
    setKanjiOnyomi('');
    setKanjiKunyomi('');
    setKanjiStrokeCount('');
    setKanjiLevel('N5');
    setKanjiLesson('');
  };

  // Open Form Modal
  const openAddModal = () => {
    resetForm();
    setFormType('add');
    setIsFormOpen(true);
  };

  const openEditModal = (item: Vocabulary | Grammar | Kanji) => {
    resetForm();
    setFormType('edit');
    setEditingId(item.id);

    if (activeTab === 'vocab') {
      const v = item as Vocabulary;
      setVocabJapanese(v.japanese);
      setVocabHiragana(v.hiragana ?? '');
      setVocabMeaning(v.meaning);
      setVocabExample(v.example ?? '');
      setVocabLevel(v.level ?? 'N5');
      setVocabLesson(v.lesson ?? '');
    } else if (activeTab === 'grammar') {
      const g = item as Grammar;
      setGrammarPattern(g.pattern);
      setGrammarMeaning(g.meaning);
      setGrammarExplanation(g.explanation ?? '');
      setGrammarExampleJa(g.example_ja ?? g.example ?? '');
      setGrammarExampleVi(g.example_vi ?? '');
      setGrammarNote(g.note ?? '');
      setGrammarLevel(g.level ?? 'N5');
      setGrammarLesson(g.lesson ?? '');
      setGrammarTextbook(g.textbook ?? '');
    } else if (activeTab === 'kanji') {
      const k = item as Kanji;
      setKanjiChar(k.kanji);
      setKanjiMeaning(k.meaning);
      setKanjiOnyomi(k.onyomi ?? '');
      setKanjiKunyomi(k.kunyomi ?? '');
      setKanjiStrokeCount(k.stroke_count?.toString() ?? '');
      setKanjiLevel(k.level ?? 'N5');
      setKanjiLesson(k.lesson ?? '');
    }
    setIsFormOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'vocab') {
        if (!vocabJapanese.trim() || !vocabMeaning.trim()) {
          showToast('Vui lòng điền đầy đủ Chữ Nhật và Ý nghĩa!', 'error');
          setLoading(false);
          return;
        }

        const payload = {
          japanese: vocabJapanese.trim(),
          hiragana: vocabHiragana.trim() || undefined,
          meaning: vocabMeaning.trim(),
          example: vocabExample.trim() || undefined,
          level: vocabLevel,
          lesson: vocabLesson.trim() || undefined,
        };

        if (formType === 'add') {
          await api.saveVocabulary(payload);
          showToast('Thêm từ vựng thành công!', 'success');
        } else if (formType === 'edit' && editingId !== null) {
          await api.updateVocabulary({ ...payload, id: editingId });
          showToast('Cập nhật từ vựng thành công!', 'success');
        }
        sessionCache.invalidate(sessionCache.KEYS.vocab);
      } else if (activeTab === 'grammar') {
        if (!grammarPattern.trim() || !grammarMeaning.trim()) {
          showToast('Vui lòng điền Cấu trúc và Ý nghĩa!', 'error');
          setLoading(false);
          return;
        }

        const payload = {
          pattern: grammarPattern.trim(),
          meaning: grammarMeaning.trim(),
          explanation: grammarExplanation.trim() || undefined,
          example_ja: grammarExampleJa.trim() || undefined,
          example_vi: grammarExampleVi.trim() || undefined,
          note: grammarNote.trim() || undefined,
          level: grammarLevel,
          lesson: grammarLesson.trim() || undefined,
          textbook: grammarTextbook.trim() || undefined,
        };

        if (formType === 'add') {
          await api.saveGrammar(payload);
          showToast('Thêm cấu trúc ngữ pháp thành công!', 'success');
        } else if (formType === 'edit' && editingId !== null) {
          await api.updateGrammar(editingId, payload);
          showToast('Cập nhật ngữ pháp thành công!', 'success');
        }
        sessionCache.invalidate(sessionCache.KEYS.grammar);
      } else if (activeTab === 'kanji') {
        if (!kanjiChar.trim() || !kanjiMeaning.trim()) {
          showToast('Vui lòng điền Chữ Hán và Ý nghĩa!', 'error');
          setLoading(false);
          return;
        }

        const strokeVal = parseInt(kanjiStrokeCount.trim(), 10);
        const payload = {
          kanji: kanjiChar.trim(),
          meaning: kanjiMeaning.trim(),
          onyomi: kanjiOnyomi.trim() || undefined,
          kunyomi: kanjiKunyomi.trim() || undefined,
          stroke_count: isNaN(strokeVal) ? undefined : strokeVal,
          level: kanjiLevel,
          lesson: kanjiLesson.trim() || undefined,
        };

        if (formType === 'add') {
          await api.saveKanji(payload);
          showToast('Thêm chữ Kanji thành công!', 'success');
        } else if (formType === 'edit' && editingId !== null) {
          await api.updateKanji(editingId, payload);
          showToast('Cập nhật Kanji thành công!', 'success');
        }
        sessionCache.invalidate(sessionCache.KEYS.kanji);
      }

      // Refresh data
      handleCloseForm();
      setRefreshTrigger(prev => prev + 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Thao tác thất bại!';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open Delete Confirm
  const openDeleteConfirm = (id: number) => {
    setDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    setLoading(true);

    try {
      if (activeTab === 'vocab') {
        await api.deleteVocabulary(deleteId);
        showToast('Đã xóa từ vựng!', 'success');
        sessionCache.invalidate(sessionCache.KEYS.vocab);
      } else if (activeTab === 'grammar') {
        await api.deleteGrammar(deleteId);
        showToast('Đã xóa ngữ pháp!', 'success');
        sessionCache.invalidate(sessionCache.KEYS.grammar);
      } else if (activeTab === 'kanji') {
        await api.deleteKanji(deleteId);
        showToast('Đã xóa Kanji!', 'success');
        sessionCache.invalidate(sessionCache.KEYS.kanji);
      }
      setIsDeleteConfirmOpen(false);
      setDeleteId(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể xóa mục này!';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtered List Memoized
  const filteredList = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (activeTab === 'vocab') {
      return vocabList.filter(item => {
        const matchesSearch =
          item.japanese.toLowerCase().includes(query) ||
          item.meaning.toLowerCase().includes(query) ||
          (item.hiragana && item.hiragana.toLowerCase().includes(query));
        const matchesLevel = levelFilter === 'all' || item.level === levelFilter;
        return matchesSearch && matchesLevel;
      });
    } else if (activeTab === 'grammar') {
      return grammarList.filter(item => {
        const matchesSearch =
          item.pattern.toLowerCase().includes(query) ||
          item.meaning.toLowerCase().includes(query);
        const matchesLevel = levelFilter === 'all' || item.level === levelFilter;
        return matchesSearch && matchesLevel;
      });
    } else {
      return kanjiList.filter(item => {
        const matchesSearch =
          item.kanji.toLowerCase().includes(query) ||
          item.meaning.toLowerCase().includes(query) ||
          (item.onyomi && item.onyomi.toLowerCase().includes(query)) ||
          (item.kunyomi && item.kunyomi.toLowerCase().includes(query));
        const matchesLevel = levelFilter === 'all' || item.level === levelFilter;
        return matchesSearch && matchesLevel;
      });
    }
  }, [activeTab, vocabList, grammarList, kanjiList, searchQuery, levelFilter]);

  // Paginated Data
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-adjust page if current page exceeds total pages
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredList.length, currentPage, totalPages]);

  // Access denied screen if not admin
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4 animate-fade-in-up">
        <span className="material-symbols-outlined text-6xl text-error bg-error/10 p-4 rounded-3xl">gpp_maybe</span>
        <h2 className="text-2xl font-black text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Truy cập bị từ chối
        </h2>
        <p className="text-on-surface-variant text-sm max-w-md">
          Bạn không có quyền quản trị viên để truy cập trang này. Vui lòng đăng nhập bằng tài khoản có quyền truy cập phù hợp.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-primary px-6 py-2.5 rounded-xl font-semibold mt-2"
        >
          Quay lại Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Quản Trị Hệ Thống
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Quản lý kho dữ liệu Từ vựng, Ngữ pháp và chữ Kanji</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 self-start shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Thêm mới
        </button>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-outline/10 gap-2 p-1 bg-surface-dim rounded-xl max-w-md">
        {(['vocab', 'grammar', 'kanji'] as TabType[]).map(t => {
          const tabLabels: Record<TabType, string> = {
            vocab: 'Từ vựng',
            grammar: 'Ngữ pháp',
            kanji: 'Kanji',
          };
          const tabIcons: Record<TabType, string> = {
            vocab: 'menu_book',
            grammar: 'edit_note',
            kanji: 'translate',
          };
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === t
                  ? 'bg-white dark:bg-surface text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tabIcons[t]}</span>
              {tabLabels[t]}
            </button>
          );
        })}
      </div>

      {/* Controls: Search & filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
            search
          </span>
          <input
            type="text"
            placeholder={`Tìm kiếm theo ${activeTab === 'vocab' ? 'từ vựng, hiragana, ý nghĩa...' : activeTab === 'grammar' ? 'mẫu cấu trúc, ý nghĩa...' : 'chữ kanji, âm đọc, ý nghĩa...'}`}
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
          />
        </div>

        {/* Level Select */}
        <div className="relative">
          <select
            value={levelFilter}
            onChange={e => {
              setLevelFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-bold text-on-surface cursor-pointer appearance-none"
          >
            <option value="all">Tất cả trình độ</option>
            <option value="N5">N5 (Sơ cấp 1)</option>
            <option value="N4">N4 (Sơ cấp 2)</option>
            <option value="N3">N3 (Trung cấp)</option>
            <option value="N2">N2 (Thượng cấp)</option>
            <option value="N1">N1 (Cao cấp)</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            keyboard_arrow_down
          </span>
        </div>
      </div>

      {/* DATA VIEW CONTAINER */}
      {loading && paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant font-medium">Đang đồng bộ dữ liệu...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="card p-12 text-center border border-outline/5">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">find_in_page</span>
          <h3 className="font-bold text-base text-on-surface mt-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Không tìm thấy bản ghi nào
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">Hãy thử thay đổi điều kiện tìm kiếm hoặc bộ lọc trình độ.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* DESKTOP TABLE */}
          <div className="hidden md:block card overflow-hidden border border-outline/5 p-0">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-dim text-on-surface-variant text-xs font-bold uppercase tracking-wider border-b border-outline/10">
                  {activeTab === 'vocab' && (
                    <>
                      <th className="py-3.5 px-4 w-[20%]">Chữ Nhật</th>
                      <th className="py-3.5 px-4 w-[20%]">Hiragana</th>
                      <th className="py-3.5 px-4 w-[25%]">Ý nghĩa</th>
                      <th className="py-3.5 px-4 w-[10%] text-center">Trình độ</th>
                      <th className="py-3.5 px-4 w-[10%] text-center">Bài</th>
                    </>
                  )}
                  {activeTab === 'grammar' && (
                    <>
                      <th className="py-3.5 px-4 w-[25%]">Cấu trúc</th>
                      <th className="py-3.5 px-4 w-[35%]">Ý nghĩa</th>
                      <th className="py-3.5 px-4 w-[15%]">Giáo trình</th>
                      <th className="py-3.5 px-4 w-[10%] text-center">Trình độ</th>
                      <th className="py-3.5 px-4 w-[10%] text-center">Bài</th>
                    </>
                  )}
                  {activeTab === 'kanji' && (
                    <>
                      <th className="py-3.5 px-4 w-[15%] text-center">Kanji</th>
                      <th className="py-3.5 px-4 w-[20%]">Ý nghĩa Hán Việt</th>
                      <th className="py-3.5 px-4 w-[20%]">Onyomi</th>
                      <th className="py-3.5 px-4 w-[20%]">Kunyomi</th>
                      <th className="py-3.5 px-4 w-[10%] text-center">Trình độ</th>
                      <th className="py-3.5 px-4 w-[10%] text-center">Bài</th>
                    </>
                  )}
                  <th className="py-3.5 px-4 text-center w-[15%]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10 text-sm">
                {paginatedData.map(item => (
                  <tr key={item.id} className="hover:bg-surface-dim/40 transition-colors">
                    {/* VOCAB BODY */}
                    {activeTab === 'vocab' && (
                      <>
                        <td className="py-3 px-4 font-bold text-on-surface text-base">{(item as Vocabulary).japanese}</td>
                        <td className="py-3 px-4 font-medium text-on-surface-variant">{(item as Vocabulary).hiragana}</td>
                        <td className="py-3 px-4 font-medium text-on-surface text-sm">{(item as Vocabulary).meaning}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary">
                            {(item as Vocabulary).level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-on-surface-variant">
                          {(item as Vocabulary).lesson ? `Bài ${(item as Vocabulary).lesson}` : '-'}
                        </td>
                      </>
                    )}
                    {/* GRAMMAR BODY */}
                    {activeTab === 'grammar' && (
                      <>
                        <td className="py-3 px-4 font-bold text-on-surface text-base">{(item as Grammar).pattern}</td>
                        <td className="py-3 px-4 font-medium text-on-surface text-sm">{(item as Grammar).meaning}</td>
                        <td className="py-3 px-4 font-semibold text-on-surface-variant">{(item as Grammar).textbook || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                            {(item as Grammar).level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-on-surface-variant">
                          {(item as Grammar).lesson ? `Bài ${(item as Grammar).lesson}` : '-'}
                        </td>
                      </>
                    )}
                    {/* KANJI BODY */}
                    {activeTab === 'kanji' && (
                      <>
                        <td className="py-3 px-4 text-center font-black text-2xl text-primary font-japanese">{(item as Kanji).kanji}</td>
                        <td className="py-3 px-4 font-bold text-on-surface">{(item as Kanji).meaning}</td>
                        <td className="py-3 px-4 font-medium text-on-surface-variant">{(item as Kanji).onyomi || '-'}</td>
                        <td className="py-3 px-4 font-medium text-on-surface-variant">{(item as Kanji).kunyomi || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
                            {(item as Kanji).level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-on-surface-variant">
                          {(item as Kanji).lesson ? `Bài ${(item as Kanji).lesson}` : '-'}
                        </td>
                      </>
                    )}

                    {/* ACTIONS */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary-50 text-primary hover:text-primary-dark transition-colors"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(item.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-error/10 text-error hover:text-error-dark transition-colors"
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD LIST */}
          <div className="md:hidden space-y-3">
            {paginatedData.map(item => (
              <div key={item.id} className="card p-4 border border-outline/5 relative overflow-hidden bg-white dark:bg-surface">
                {activeTab === 'vocab' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-bold text-on-surface">{(item as Vocabulary).japanese}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 text-primary">
                        {(item as Vocabulary).level}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">Hiragana: {(item as Vocabulary).hiragana}</p>
                    <p className="text-sm font-semibold text-on-surface">{(item as Vocabulary).meaning}</p>
                    {(item as Vocabulary).lesson && (
                      <span className="inline-block text-[10px] font-bold text-on-surface-variant bg-surface-dim px-2 py-0.5 rounded">
                        Bài {(item as Vocabulary).lesson}
                      </span>
                    )}
                  </div>
                )}

                {activeTab === 'grammar' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <h4 className="text-base font-bold text-on-surface">{(item as Grammar).pattern}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                        {(item as Grammar).level}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-on-surface">{(item as Grammar).meaning}</p>
                    <div className="flex gap-2">
                      {(item as Grammar).textbook && (
                        <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-dim px-2 py-0.5 rounded">
                          {(item as Grammar).textbook}
                        </span>
                      )}
                      {(item as Grammar).lesson && (
                        <span className="text-[10px] font-bold text-on-surface-variant bg-surface-dim px-2 py-0.5 rounded">
                          Bài {(item as Grammar).lesson}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'kanji' && (
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-xl bg-primary-50/30 flex items-center justify-center shrink-0">
                      <span className="text-3xl font-black text-primary font-japanese">{(item as Kanji).kanji}</span>
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-base font-bold text-on-surface">{(item as Kanji).meaning}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700">
                          {(item as Kanji).level}
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant truncate">On: {(item as Kanji).onyomi || '-'}</p>
                      <p className="text-[10px] text-on-surface-variant truncate">Kun: {(item as Kanji).kunyomi || '-'}</p>
                      {(item as Kanji).lesson && (
                        <span className="inline-block text-[10px] font-bold text-on-surface-variant bg-surface-dim px-2 py-0.5 rounded mt-1">
                          Bài {(item as Kanji).lesson}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions float top-right */}
                <div className="absolute right-3 bottom-3 flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-50/50 hover:bg-primary-50 text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(item.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-error/5 hover:bg-error/10 text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION CONTROL */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-surface-dim/40 border border-outline/5 p-3 rounded-xl">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="btn btn-outline border-outline/10 text-on-surface-variant hover:text-on-surface disabled:opacity-40 disabled:pointer-events-none px-3.5 py-1.5 rounded-lg text-xs font-bold"
              >
                Trang trước
              </button>
              <span className="text-xs text-on-surface-variant font-bold">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="btn btn-outline border-outline/10 text-on-surface-variant hover:text-on-surface disabled:opacity-40 disabled:pointer-events-none px-3.5 py-1.5 rounded-lg text-xs font-bold"
              >
                Trang tiếp
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================== */}
      {/* FORM MODAL (ADD & EDIT) */}
      {/* ============================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            onClick={handleCloseForm}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-surface rounded-2xl w-full max-w-lg overflow-hidden shadow-elevated border border-outline/10 animate-fade-in-up max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-outline/10">
              <h3 className="font-bold text-lg text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {formType === 'add' ? 'Thêm mới' : 'Chỉnh sửa'}{' '}
                {activeTab === 'vocab' ? 'Từ vựng' : activeTab === 'grammar' ? 'Ngữ pháp' : 'Kanji'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-dim text-on-surface-variant transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* VOCAB FORM FIELDS */}
              {activeTab === 'vocab' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Chữ Nhật (Kanji/Kana) *</label>
                    <input
                      type="text"
                      required
                      value={vocabJapanese}
                      onChange={e => setVocabJapanese(e.target.value)}
                      placeholder="VD: 食べる, 日本語..."
                      className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Cách đọc (Hiragana)</label>
                    <input
                      type="text"
                      value={vocabHiragana}
                      onChange={e => setVocabHiragana(e.target.value)}
                      placeholder="VD: たべる, にほんご..."
                      className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Ý nghĩa (Tiếng Việt) *</label>
                    <input
                      type="text"
                      required
                      value={vocabMeaning}
                      onChange={e => setVocabMeaning(e.target.value)}
                      placeholder="VD: Ăn, Tiếng Nhật..."
                      className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Ví dụ minh họa</label>
                    <textarea
                      value={vocabExample}
                      onChange={e => setVocabExample(e.target.value)}
                      placeholder="VD: 日本語を勉強します。"
                      rows={2}
                      className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Trình độ</label>
                      <select
                        value={vocabLevel}
                        onChange={e => setVocabLevel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold text-on-surface cursor-pointer"
                      >
                        <option value="N5">N5</option>
                        <option value="N4">N4</option>
                        <option value="N3">N3</option>
                        <option value="N2">N2</option>
                        <option value="N1">N1</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Bài số</label>
                      <input
                        type="text"
                        value={vocabLesson}
                        onChange={e => setVocabLesson(e.target.value)}
                        placeholder="VD: 1, 2, 3..."
                        className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* GRAMMAR FORM FIELDS */}
              {activeTab === 'grammar' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Mẫu cấu trúc *</label>
                    <input
                      type="text"
                      required
                      value={grammarPattern}
                      onChange={e => setGrammarPattern(e.target.value)}
                      placeholder="VD: 〜てください, 〜ています..."
                      className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Ý nghĩa *</label>
                    <input
                      type="text"
                      required
                      value={grammarMeaning}
                      onChange={e => setGrammarMeaning(e.target.value)}
                      placeholder="VD: Hãy làm gì..., Đang làm gì..."
                      className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Giải thích chi tiết</label>
                    <textarea
                      value={grammarExplanation}
                      onChange={e => setGrammarExplanation(e.target.value)}
                      placeholder="Giải thích cách dùng, hoàn cảnh và cách chia..."
                      rows={3}
                      className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Ví dụ tiếng Nhật</label>
                      <input
                        type="text"
                        value={grammarExampleJa}
                        onChange={e => setGrammarExampleJa(e.target.value)}
                        placeholder="VD: ここに書いてください。"
                        className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Ví dụ dịch tiếng Việt</label>
                      <input
                        type="text"
                        value={grammarExampleVi}
                        onChange={e => setGrammarExampleVi(e.target.value)}
                        placeholder="VD: Hãy viết vào đây."
                        className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Chú ý (Note)</label>
                    <input
                      type="text"
                      value={grammarNote}
                      onChange={e => setGrammarNote(e.target.value)}
                      placeholder="VD: Thường dùng trong văn nói trang trọng..."
                      className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Trình độ</label>
                      <select
                        value={grammarLevel}
                        onChange={e => setGrammarLevel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold text-on-surface cursor-pointer"
                      >
                        <option value="N5">N5</option>
                        <option value="N4">N4</option>
                        <option value="N3">N3</option>
                        <option value="N2">N2</option>
                        <option value="N1">N1</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Bài</label>
                      <input
                        type="text"
                        value={grammarLesson}
                        onChange={e => setGrammarLesson(e.target.value)}
                        placeholder="VD: 14"
                        className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Giáo trình</label>
                      <input
                        type="text"
                        value={grammarTextbook}
                        onChange={e => setGrammarTextbook(e.target.value)}
                        placeholder="VD: Minna..."
                        className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* KANJI FORM FIELDS */}
              {activeTab === 'kanji' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Chữ Hán *</label>
                    <input
                      type="text"
                      required
                      value={kanjiChar}
                      onChange={e => setKanjiChar(e.target.value)}
                      placeholder="VD: 私, 日, 国..."
                      className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Ý nghĩa Hán Việt *</label>
                    <input
                      type="text"
                      required
                      value={kanjiMeaning}
                      onChange={e => setKanjiMeaning(e.target.value)}
                      placeholder="VD: TƯ, NHẬT, QUỐC..."
                      className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Onyomi (Âm đọc Hán)</label>
                      <input
                        type="text"
                        value={kanjiOnyomi}
                        onChange={e => setKanjiOnyomi(e.target.value)}
                        placeholder="VD: ニチ, ジツ..."
                        className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Kunyomi (Âm đọc Nhật)</label>
                      <input
                        type="text"
                        value={kanjiKunyomi}
                        onChange={e => setKanjiKunyomi(e.target.value)}
                        placeholder="VD: ひ, び, か..."
                        className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Số nét</label>
                      <input
                        type="number"
                        value={kanjiStrokeCount}
                        onChange={e => setKanjiStrokeCount(e.target.value)}
                        placeholder="VD: 4"
                        className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Trình độ</label>
                      <select
                        value={kanjiLevel}
                        onChange={e => setKanjiLevel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold text-on-surface cursor-pointer"
                      >
                        <option value="N5">N5</option>
                        <option value="N4">N4</option>
                        <option value="N3">N3</option>
                        <option value="N2">N2</option>
                        <option value="N1">N1</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Bài</label>
                      <input
                        type="text"
                        value={kanjiLesson}
                        onChange={e => setKanjiLesson(e.target.value)}
                        placeholder="VD: 1"
                        className="w-full px-3.5 py-2 rounded-xl border border-outline/15 bg-white dark:bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Form Actions Footer */}
              <div className="flex gap-3 pt-4 border-t border-outline/10">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 py-2.5 rounded-xl border border-outline/15 text-sm font-bold text-on-surface-variant hover:bg-surface-dim transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* CONFIRM DELETE MODAL */}
      {/* ============================== */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            onClick={() => setIsDeleteConfirmOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative bg-white dark:bg-surface rounded-2xl w-full max-w-sm overflow-hidden shadow-elevated border border-outline/10 animate-fade-in-up p-5 text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-error bg-error/10 p-3 rounded-full inline-block">
              delete_forever
            </span>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Xác nhận xóa bản ghi?
              </h3>
              <p className="text-xs text-on-surface-variant">
                Hành động này sẽ xóa vĩnh viễn mục này khỏi cơ sở dữ liệu học tập và không thể khôi phục lại.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-outline/15 text-sm font-bold text-on-surface-variant hover:bg-surface-dim transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-error text-white text-sm font-bold shadow-sm hover:bg-error-dark transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
