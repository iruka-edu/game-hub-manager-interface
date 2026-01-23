"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useSubjects,
  useAgeBands,
  useLevels,
  useThemes,
} from "@/features/game-lessons/hooks/useGameLessons";

import {
  getTracksBySubjectAndAgeBand,
  getLessonsByTrack,
  getSkillsByAgeBandAndSubject,
  getSkills,
} from "@/features/game-lessons/api";
import { gamesApi } from "@/lib/backend-api";

type Option = { value: string; label: string; keywords?: string; group?: string };

type SelectName =
  | "lop"
  | "mon"
  | "quyenSach"
  | "lessonNo"
  | "game"
  | "level"
  | "skill"
  | "theme";

type Field = {
  name: SelectName;
  label: string;
  span: 6 | 12;
  disabled?: boolean;
  hint?: string;
};

interface UploadMetaFormProps {
  values: {
    lop: string;
    mon: string;
    quyenSach: string;
    lessonNo: string;
    level: string;
    game: string;
    gameId: string; // dùng upload GCS
    skills: string[];
    themes: string[];
    github: string;
  };
  onNext?: (payload: UploadMetaFormProps["values"]) => void;
}

const spanClass = (span: 6 | 12) => (span === 6 ? "sm:col-span-6" : "sm:col-span-12");

// ---- helpers map API item -> options (giữ y logic: ưu tiên name, search theo id/code/name)
function looksLikeId(str: string) {
  return (
    /^[0-9a-f]{24}$/i.test(str) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
  );
}

function toLabel(item: any) {
  const name = item?.name ?? item?.title ?? item?.label ?? "";
  const code = item?.code ?? "";
  const id = item?.id != null ? String(item.id) : "";

  if (name) return name;

  const codeIsId = looksLikeId(code) || code === id;
  return !codeIsId ? (code || id || "(unknown)") : (id || "(unknown)");
}

function toOptions(items: any[]): Option[] {
  return (Array.isArray(items) ? items : []).map((it) => {
    const id = it?.id != null ? String(it.id) : "";
    const name = it?.name ?? it?.title ?? it?.label ?? "";
    const code = it?.code ?? "";
    const group = it?.group ?? it?.category ?? "";
    return {
      value: id,
      label: toLabel(it),
      keywords: [id, code, name].filter(Boolean).join(" "),
      group: group || undefined,
    };
  });
}

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [ref, onOutside]);
}

// ---------- SearchSelect ----------
function SearchSelect(props: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  loadingText?: string;
}) {
  const {
    name,
    value,
    onChange,
    options,
    disabled,
    required,
    placeholder = "-- Chọn --",
    loadingText,
  } = props;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useOutsideClick(rootRef, () => setOpen(false));
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  const selectedLabel = useMemo(() => {
    if (disabled && loadingText) return { text: loadingText, dim: true };
    const opt = options.find((o) => o.value === value);
    if (opt) return { text: opt.label, dim: false };
    return { text: placeholder, dim: true };
  }, [disabled, loadingText, options, value, placeholder]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return options;
    return options.filter((o) => (o.keywords || `${o.value} ${o.label}`).toLowerCase().includes(qq));
  }, [options, q]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((s) => !s)}
        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300
                   disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed
                   flex items-center justify-between gap-2"
      >
        <span className={`truncate ${selectedLabel.dim ? "text-slate-400" : "text-slate-800"}`}>
          {selectedLabel.text}
        </span>
        <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        className={`${
          open ? "" : "hidden"
        } absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden`}
      >
        <div className="p-2 border-b border-slate-100">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm..."
            className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-300"
          />
        </div>
        <div className="max-h-64 overflow-auto p-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm font-bold text-slate-400">Không tìm thấy</div>
          ) : (
            filtered.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-left"
                >
                  <div className="text-sm font-bold text-slate-700">{o.label}</div>
                  <span className="text-xs font-black text-iruka-blue">{active ? "✓" : ""}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* hidden select để submit GET + required */}
      <select
        name={name}
        required={required}
        disabled={disabled}
        className="hidden"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------- MultiSelect ----------
function MultiSelect(props: {
  name: string;
  values: string[];
  onChange: (v: string[]) => void;
  options: Option[];
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  loadingText?: string;
}) {
  const { name, values, onChange, options, disabled, required, placeholder = "-- Chọn --", loadingText } = props;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useOutsideClick(rootRef, () => setOpen(false));
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return options;
    return options.filter((o) => (o.keywords || `${o.value} ${o.label}`).toLowerCase().includes(qq));
  }, [options, q]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Option[]>();
    const ungrouped: Option[] = [];
    for (const o of filtered) {
      const g = o.group?.trim();
      if (g) {
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g)!.push(o);
      } else {
        ungrouped.push(o);
      }
    }
    return { groups, ungrouped };
  }, [filtered]);

  const toggle = (id: string) => {
    onChange(values.includes(id) ? values.filter((x) => x !== id) : [...values, id]);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((s) => !s)}
        className="w-full min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-300
                   disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed
                   flex items-center justify-between gap-2"
      >
        <div className="min-w-0 flex-1 flex items-center gap-1 flex-wrap overflow-hidden">
          {disabled && loadingText ? (
            <span className="text-slate-400 font-bold text-sm truncate">{loadingText}</span>
          ) : values.length === 0 ? (
            <span className="text-slate-400 font-bold">{placeholder}</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700">
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-black">
                {values.length}
              </span>
              <span className="truncate">mục đã chọn</span>
            </span>
          )}
        </div>

        <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        className={`${
          open ? "" : "hidden"
        } absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden`}
      >
        <div className="p-2 border-b border-slate-100">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm..."
            className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-300"
          />
        </div>

        <div className="max-h-64 overflow-auto p-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm font-bold text-slate-400">Không tìm thấy</div>
          ) : (
            <>
              {Array.from(grouped.groups.entries()).map(([gName, gOpts]) => (
                <div key={gName}>
                  <div className="px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50 sticky top-0">
                    {gName}
                  </div>
                  {gOpts.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggle(o.value)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-left"
                    >
                      <input type="checkbox" readOnly checked={values.includes(o.value)} className="w-4 h-4" />
                      <div className="text-sm font-bold text-slate-700">{o.label}</div>
                    </button>
                  ))}
                </div>
              ))}

              {grouped.ungrouped.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-left"
                >
                  <input type="checkbox" readOnly checked={values.includes(o.value)} className="w-4 h-4" />
                  <div className="text-sm font-bold text-slate-700">{o.label}</div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* hidden select multiple để submit GET */}
      <select
        name={name}
        multiple
        required={required}
        disabled={disabled}
        className="hidden"
        value={values}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions).map((x) => x.value);
          onChange(selected);
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <p className="mt-1 text-[11px] font-bold text-slate-400">Chọn nhiều mục (tick checkbox).</p>
    </div>
  );
}

// ========================= MAIN =========================
export function UploadMetaForm({ values , onNext }: UploadMetaFormProps) {
  // base lists from existing hooks
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: ageBands, isLoading: ageBandsLoading } = useAgeBands();
  const { data: levelsData, isLoading: levelsLoading } = useLevels();
  const { data: themesData, isLoading: themesLoading } = useThemes();

  // selections
  const [lop, setLop] = useState(values.lop ?? "");
  const [mon, setMon] = useState(values.mon ?? "");
  const [quyenSach, setQuyenSach] = useState(values.quyenSach ?? "");
  const [lessonNo, setLessonNo] = useState(values.lessonNo ?? "");
  const [game, setGame] = useState(values.game ?? "");
  const [gameId, setGameId] = useState(values.gameId ?? "");
  const [level, setLevel] = useState(values.level ?? "");
  const [skill, setSkill] = useState<string[]>(Array.isArray(values.skills) ? values.skills : []);
  const [theme, setTheme] = useState<string[]>(Array.isArray(values.themes) ? values.themes : []);
  const [github, setGithub] = useState(values.github ?? "");

  // dependent options loaded via existing API functions
  const [tracks, setTracks] = useState<Option[]>([]);
  const [lessons, setLessons] = useState<Option[]>([]);
  const [games, setGames] = useState<Option[]>([]);
  const [skills, setSkills] = useState<Option[]>([]);

  // loading per dependent
  const [loading, setLoading] = useState({
    quyenSach: false,
    lesson: false,
    game: false,
    skill: false,
  });

  // map hook data -> options
  const lops = useMemo(() => toOptions(ageBands ?? []), [ageBands]);
  const mons = useMemo(() => toOptions(subjects ?? []), [subjects]);
  const levels = useMemo(() => toOptions(levelsData ?? []), [levelsData]);
  const themes = useMemo(() => toOptions(themesData ?? []), [themesData]);

  const has = (k: SelectName) => {
    const v: any =
      k === "lop"
        ? lop
        : k === "mon"
        ? mon
        : k === "quyenSach"
        ? quyenSach
        : k === "lessonNo"
        ? lessonNo
        : k === "game"
        ? game
        : k === "level"
        ? level
        : k === "skill"
        ? skill
        : theme;
    if (Array.isArray(v)) return v.length > 0;
    return Boolean(v && String(v).trim().length > 0);
  };

  const fields: Field[] = useMemo(
    () => [
      { name: "lop", label: "LỚP / ĐỘ TUỔI", span: 6 },
      { name: "mon", label: "MÔN", span: 6 },

      {
        name: "quyenSach",
        label: "QUYỂN SÁCH / TRACK",
        span: 12,
        disabled: !has("lop") || !has("mon"),
        hint: "Chọn Lớp và Môn học trước",
      },

      {
        name: "lessonNo",
        label: "LESSON",
        span: 12,
        disabled: !has("quyenSach"),
        hint: "Chọn Quyển sách trước",
      },

      {
        name: "game",
        label: "GAME",
        span: 12,
        disabled: !has("lessonNo"),
        hint: "Chọn Lesson trước",
      },

      { name: "level", label: "LEVEL", span: 12 },
      { name: "skill", label: "SKILL", span: 6 },
      { name: "theme", label: "THEME", span: 6 },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lop, mon, quyenSach, lessonNo, game, level, skill, theme],
  );

  // ---- chain loaders using existing API functions ----
  useEffect(() => {
    // reset downstream
    setQuyenSach("");
    setLessonNo("");
    setGame("");
    setTracks([]);
    setLessons([]);
    setGames([]);

    if (!lop || !mon) return;

    (async () => {
      setLoading((s) => ({ ...s, quyenSach: true }));
      try {
        const data = await getTracksBySubjectAndAgeBand(mon, lop);
        setTracks(toOptions(data as any[]));
      } finally {
        setLoading((s) => ({ ...s, quyenSach: false }));
      }
    })().catch(console.error);

    (async () => {
      setLoading((s) => ({ ...s, skill: true }));
      try {
        // nếu có filter endpoint thì dùng filter, không thì fallback all
        const data = await getSkillsByAgeBandAndSubject(lop, mon).catch(async () => {
          return await getSkills();
        });
        const opts = toOptions(data as any[]);
        setSkills(opts);
        // loại bỏ selected không còn tồn tại
        setSkill((prev) => prev.filter((id) => opts.some((o) => o.value === id)));
      } finally {
        setLoading((s) => ({ ...s, skill: false }));
      }
    })().catch(console.error);
  }, [lop, mon]);

  useEffect(() => {
    setLessonNo("");
    setGame("");
    setLessons([]);
    setGames([]);

    if (!quyenSach) return;

    (async () => {
      setLoading((s) => ({ ...s, lesson: true }));
      try {
        const data = await getLessonsByTrack(quyenSach);
        setLessons(toOptions(data as any[]));
      } finally {
        setLoading((s) => ({ ...s, lesson: false }));
      }
    })().catch(console.error);
  }, [quyenSach]);

  useEffect(() => {
    setGame("");
    setGames([]);

    if (!lessonNo) return;

    (async () => {
      setLoading((s) => ({ ...s, game: true }));
      try {
        const data = await gamesApi.getGamesByLesson(lessonNo);
        setGames(toOptions(data as any[]));
      } finally {
        setLoading((s) => ({ ...s, game: false }));
      }
    })().catch(console.error);
  }, [lessonNo]);

  const isSearchable = (name: SelectName) => name === "quyenSach" || name === "lessonNo";
  const isMulti = (name: SelectName) => name === "skill" || name === "theme";

  const optionsByName: Record<SelectName, Option[]> = {
    lop: lops,
    mon: mons,
    quyenSach: tracks,
    lessonNo: lessons,
    game: games,
    level: levels,
    skill: skills,
    theme: themes,
  };

  const loadingText = (name: SelectName) => {
    if (name === "lop" && ageBandsLoading) return "Đang tải độ tuổi...";
    if (name === "mon" && subjectsLoading) return "Đang tải môn...";
    if (name === "level" && levelsLoading) return "Đang tải level...";
    if (name === "theme" && themesLoading) return "Đang tải theme...";
    if (name === "quyenSach" && loading.quyenSach) return "Đang tải quyển sách...";
    if (name === "lessonNo" && loading.lesson) return "Đang tải lesson...";
    if (name === "game" && loading.game) return "Đang tải game...";
    if (name === "skill" && loading.skill) return "Đang tải skill...";
    return undefined;
  };

  const resetAll = () => {
    setLop("");
    setMon("");
    setQuyenSach("");
    setLessonNo("");
    setGame("");
    setLevel("");
    setSkill([]);
    setTheme([]);
    setGithub("");

    setTracks([]);
    setLessons([]);
    setGames([]);

    // clear querystring (không reload)
    window.history.replaceState(null, "", window.location.pathname);
  };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Nếu không truyền onNext thì giữ behavior cũ: submit GET theo action/method
    if (!onNext) return;

    e.preventDefault();

    // Chặn nếu form chưa hợp lệ (required)
    const form = e.currentTarget;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Gửi data lên màn tiếp theo (GIỮ LOGIC CHUYỂN MÀN)
      onNext({
        lop,
        mon,
        quyenSach,
        lessonNo: lessonNo,
        game,
        gameId,
        level,
        skills: skill,
        themes: theme,
        github,
      } as any);
    };

  return (
    <form
      id="upload-meta-form"
      method="get"
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-black text-slate-900">Chọn thông tin gắn vào Cây kiến thức</h2>
          <p className="text-xs font-bold text-slate-500 mt-1">
            Các trường theo tầng sẽ mở dần theo lựa chọn của bạn. Link github là nhập tay.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {fields.map((f) => {
          const disabled =
            Boolean(f.disabled) ||
            Boolean(loadingText(f.name)) ||
            (f.name === "lop" && ageBandsLoading) ||
            (f.name === "mon" && subjectsLoading);

          const opts = optionsByName[f.name];

          return (
            <label key={f.name} className={`block ${spanClass(f.span)}`}>
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                {f.label}
              </span>

              {isMulti(f.name) ? (
                <MultiSelect
                  name={f.name}
                  values={f.name === "skill" ? skill : theme}
                  onChange={(arr) => (f.name === "skill" ? setSkill(arr) : setTheme(arr))}
                  options={opts}
                  disabled={disabled}
                  required
                  loadingText={loadingText(f.name)}
                />
              ) : isSearchable(f.name) ? (
                <SearchSelect
                  name={f.name}
                  value={f.name === "quyenSach" ? quyenSach : lessonNo}
                  onChange={(v) => (f.name === "quyenSach" ? setQuyenSach(v) : setLessonNo(v))}
                  options={opts}
                  disabled={disabled}
                  required
                  loadingText={loadingText(f.name)}
                />
              ) : (
                <select
                  name={f.name}
                  required
                  disabled={disabled}
                  value={
                    f.name === "lop"
                      ? lop
                      : f.name === "mon"
                      ? mon
                      : f.name === "game"
                      ? game
                      : f.name === "level"
                      ? level
                      : ""
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (f.name === "lop") setLop(v);
                    if (f.name === "mon") setMon(v);
                    if (f.name === "game") setGame(v);
                    if (f.name === "level") setLevel(v);
                  }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300
                             disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>
                    {loadingText(f.name) ?? "-- Chọn --"}
                  </option>
                  {opts.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}

              {f.disabled && f.hint && (
                <p className="mt-1 text-[11px] font-bold text-slate-400">{f.hint}</p>
              )}
            </label>
          );
        })}

        <label className="block sm:col-span-12">
          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
            GAME ID (GCS)
          </span>

          <input
            type="text"
            name="gameId"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="com.iruka.math-addition"
            pattern="^[a-z0-9.-]+$"
            title="Chỉ được dùng chữ thường, số, dấu chấm và gạch ngang"
            required
            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 outline-none focus:border-blue-300
                      font-mono"
          />

          <p className="mt-1 text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Định dạng: com.iruka.tên-game (chữ thường, số, dấu chấm, gạch ngang)
          </p>
        </label>

        <label className="block sm:col-span-12">
          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
            Link github
          </span>
          <input
            name="github"
            required
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            placeholder="https://github.com/your-org/your-repo (hoặc link PR/commit)"
            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300"
          />
          <p className="mt-1 text-[11px] font-bold text-slate-500">
            Tip: có thể dán link commit/tag để trace build.
          </p>
        </label>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:border-slate-300"
        >
          Reset
        </button>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2b9bf6] px-5 text-sm font-black text-white shadow-md hover:bg-[#1a88f4]"
        >
          Tiếp tục Upload →
        </button>
      </div>
    </form>
  );
}
