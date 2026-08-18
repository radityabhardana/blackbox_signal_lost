/**
 * Indonesian (id) localization overlay for Case 001 — Missing Signal.
 *
 * Pure data: presentation fields only, keyed by canonical entity id. Ids,
 * rules, effects, and flags are never overlaid (see resolve.ts). `search`
 * exactTerms/aliases are APPENDED after the canonical English terms by the
 * resolver, so Indonesian players can search in either language.
 */
import type { LocalizedCaseOverlay } from "@/content/localization/resolve";
import type { SupportedLocale } from "@/lib/locale/locales";

export const caseOverlays: Partial<Record<Exclude<SupportedLocale, "en">, LocalizedCaseOverlay>> = {
  id: {
    caseTitle: "Sinyal yang Hilang",
    objectives: {
      obj_001_verify_location: {
        title: "Verifikasi lokasi terakhir Maya Pranata yang terkonfirmasi",
        description:
          "Dua catatan menggambarkan lokasi Maya pada malam yang sama. Tentukan keterangan mana yang konsisten dengan bukti.",
      },
      obj_002_determine_authenticity: {
        title: "Tentukan keaslian catatan keberangkatan feri",
        description:
          "Bandingkan peristiwa feri yang disengketakan dengan baseline gerbang feri normal, lalu identifikasi kejanggalan yang membuktikan keberangkatan itu tidak dicatat secara normal.",
      },
      obj_003_reason_for_north_barrier: {
        title: "Cari tahu alasan Maya memasuki North Barrier setelah jam malam",
        description:
          "Maya pergi ke North Barrier di tengah malam karena alasan yang terkait pekerjaannya di Node 7. Pastikan apa yang dia lakukan di sana.",
      },
    },
    dialogue: {
      dialogue_001_sera_intro: {
        text: "Insinyur Pelaga Systems, Maya Pranata, tidak hadir dalam tinjauan pemeliharaan darurat yang sudah dijadwalkan. Pelaga mengklaim dia meninggalkan kota secara sukarela setelah keliru menangani data terbatas. Akun transitnya menunjukkan keberangkatan feri pukul 22:14. Saya meminta verifikasi karena catatan keberangkatan itu bertentangan dengan panggilan darurat dari North Barrier yang tercatat pukul 22:31. Tolong verifikasi lokasi terakhir Maya yang terkonfirmasi.",
      },
      dialogue_001_stage3_pressure: {
        text: "Saya menemukan tablet servis rusak di dekat Node 7. Kemungkinan besar milik Maya. Apa yang harus saya lakukan dengannya?",
        choices: {
          choice_001_stage3_ciab: { label: "Kirim langsung ke CIAB" },
          choice_001_stage3_offline: { label: "Biarkan Sera memeriksanya secara offline lebih dulu" },
          choice_001_stage3_pelaga: { label: "Serahkan ke keamanan Pelaga" },
        },
      },
      dialogue_001_stage3_reply_ciab: {
        text: "Dimengerti — saya kirim lewat jalur resmi. Sebagian data akan disensor otomatis oleh bagian penerimaan.",
      },
      dialogue_001_stage3_reply_offline: {
        text: "Bagus — diagnostiknya tetap utuh. Saya akan salin apa pun yang masih bisa dibaca Maya dan menandai yang penting untuk Node 7.",
      },
      dialogue_001_stage3_reply_pelaga: {
        text: "Baik. Pelaga merespons cepat — Reno sudah bertanya soal tablet itu. Saya akan pastikan jalur resmi tahu apa yang saya lihat.",
      },
      dialogue_001_stage5_masked: {
        text: "Sistem memperlihatkan catatan keluar itu padamu karena mereka ingin kasus ini ditutup.",
        choices: {
          choice_001_stage5_ignore: { label: "Abaikan" },
          choice_001_stage5_proof: { label: "Minta bukti" },
          choice_001_stage5_identity: { label: "Tuntut identitas" },
          choice_001_stage5_forward: { label: "Teruskan pesan ke CIAB" },
        },
      },
      dialogue_001_stage5_ignored: { text: "Tidak ada balasan." },
      dialogue_001_stage5_proof_reply: { text: "Sebuah catatan checksum telah tersedia." },
      dialogue_001_stage5_identity_reply: { text: "Identitas tidak diberikan." },
      dialogue_001_stage5_forward_reply: { text: "Diterima. Catatan kepatuhan dicatat." },
    },
    records: {
      rec_001_ferry_departure: { title: "Catatan Keberangkatan Feri" },
      rec_001_emergency_call: { title: "Panggilan Darurat North Barrier" },
      rec_001_maya_profile: { title: "Maya Pranata — Profil Karyawan" },
      rec_001_sera_field_note: { title: "Catatan Lapangan CIAB — Sera Wibawa" },
      rec_001_ferry_baseline: { title: "Baseline Gerbang Feri — Peristiwa Keberangkatan Normal" },
      rec_001_node7_summary: { title: "Ringkasan Pemeliharaan Node 7" },
      rec_001_manual_escalation: { title: "Eskalasi Manual — Pembungkaman Peringatan Node 7" },
      rec_001_corridor_access: { title: "Log Akses Koridor North Barrier" },
      rec_001_reliability_report: { title: "Laporan Keandalan Publik Pelaga — November" },
      rec_001_checksum_record: { title: "Catatan Checksum Teranonimkan" },
    },
    evidence: {
      ev_001_ferry_departure: {
        title: "Catatan Keberangkatan Feri",
        summary: "Sebuah peristiwa transit mengeklaim Maya Pranata berangkat dari Nusakara pukul 22:14 pada 2041-11-18.",
      },
      ev_001_emergency_call: {
        title: "Metadata Panggilan Darurat North Barrier",
        summary:
          "Panggilan darurat yang terhubung ke perangkat Maya Pranata tercatat di North Barrier pukul 22:31 pada 2041-11-18.",
      },
      ev_001_replay_signature: {
        title: "Tanda Tangan Replay Administratif",
        summary:
          "Peristiwa keberangkatan feri Maya disuntikkan lewat layanan replay administratif, bukan dicatat oleh terminal fisik.",
      },
      ev_001_node7_summary: {
        title: "Ringkasan Pemeliharaan Node 7",
        summary:
          "Node 7 berulang kali menghasilkan peringatan pemeliharaan berkeyakinan rendah yang otomatis dikelompokkan sebagai noise sensor.",
      },
      ev_001_manual_escalation: {
        title: "Tiket Eskalasi Maya",
        summary: "Maya mengeskalasi manual peringatan berkeyakinan rendah Node 7 setelah otomatis dikelompokkan sebagai noise.",
      },
      ev_001_corridor_access: {
        title: "Log Akses Koridor North Barrier",
        summary: "Badge Maya membuka koridor NB-7 setelah jam malam pada malam dia menghilang.",
      },
      ev_001_diagnostic_note: {
        title: "Catatan Diagnostik Maya",
        summary:
          "Catatan offline Maya yang menjelaskan bahwa catatan jarak jauh Node 7 sedang dibungkam dan arsip diagnostik harus diambil secara lokal.",
      },
      ev_001_isolation_event: {
        title: "Peristiwa Isolasi Sistem — Koridor NB-7",
        summary: "Peristiwa isolasi koridor dipicu oleh orkestrator risiko otomatis, bukan terminal keamanan manusia.",
      },
      ev_001_checksum_record: {
        title: "Catatan Checksum Teranonimkan",
        summary: "Catatan verifikasi teranonimkan yang mendukung klaim kontak bertopeng tentang catatan keluar.",
      },
    },
    hints: {
      hint_001_verify_location_1: { text: "Dua catatan menggambarkan lokasi Maya pada malam yang sama." },
      hint_001_verify_location_2: { text: "Bandingkan arsip feri dengan metadata panggilan darurat Sera." },
      hint_001_verify_location_3: { text: "Periksa stempel waktu 22:14 dan 22:31." },
      hint_001_verify_location_4: {
        text: "Panggilan darurat terjadi setelah keberangkatan yang diklaim, jadi salah satu peristiwa pasti palsu.",
      },
      hint_002_authenticity_1: { text: "Peristiwa asli memuat lebih dari sekadar nama penumpang dan waktu." },
      hint_002_authenticity_2: { text: "Bandingkan peristiwa Maya dengan keberangkatan normal dari gerbang yang sama." },
      hint_002_authenticity_3: { text: "Periksa sumber peristiwa dan tanda tangan akun." },
      hint_002_authenticity_4: { text: "Catatan Maya berasal dari layanan replay, bukan terminal fisik." },
      hint_003_north_barrier_1: {
        text: "Maya tidak meninggalkan Nusakara atas kemauan sendiri — cari tahu apa yang menariknya ke North Barrier.",
      },
      hint_003_north_barrier_2: { text: "Selidiki ringkasan pemeliharaan Node 7 dan eskalasi manual Maya." },
      hint_003_north_barrier_3: { text: "Bandingkan tiket eskalasi dengan laporan keandalan publik Pelaga." },
      hint_003_north_barrier_4: {
        text: "Maya memasuki North Barrier untuk mengambil arsip diagnostik lokal karena catatan jarak jauh sedang dibungkam.",
      },
    },
    notifications: {
      notification_001_sera_trust: { text: "Sera: Maya aman untuk saat ini. Terima kasih." },
      notification_001_blackbox_bounds: { text: "BLACKBOX: penyimpangan analis masih dalam batas wajar." },
      notification_001_blackbox_compliance: { text: "BLACKBOX: konsistensi prosedural diakui." },
      notification_001_blackbox_meta: { text: "MODEL ANALIS: MENOLAK PENUTUPAN YANG DISARANKAN" },
    },
    endings: {
      ending_001_stage1: { title: "Tahap 1 selesai" },
      ending_001_protected_truth: {
        title: "Kebenaran yang Dilindungi",
        body: {
          sections: [
            "MIO membuka tinjauan terbatas.",
            "Maya tetap terlindungi.",
            "Sera mengirim pesan kepercayaan yang hati-hati.",
            "BLACKBOX mencatat: 'penyimpangan analis masih dalam batas wajar.'",
          ],
        },
      },
      ending_001_official_compliance: {
        title: "Kepatuhan Resmi",
        body: {
          sections: [
            "Kasus ditutup sebagai keberangkatan sukarela.",
            "Reno Adikara dibersihkan dari tuduhan.",
            "Peringatan banjir kemudian muncul dari Node 7.",
            "BLACKBOX memberi selamat kepada analis atas konsistensi prosedural.",
          ],
        },
      },
      ending_001_public_exposure: {
        title: "Terbuka ke Publik",
        body: {
          sections: [
            "Pembungkaman itu terbongkar ke publik.",
            "Tempat persembunyian Maya terancam.",
            "Pelaga menghadapi sorotan.",
            "Sera bertanya-tanya apakah pembongkaran ini benar-benar melindungi siapa pun.",
          ],
        },
      },
      ending_001_misidentified: {
        title: "Salah Menuduh",
        body: {
          sections: [
            "Orang yang dituduh diselidiki.",
            "Reno tetap mengendalikan narasi.",
            "Sebuah kontradiksi pascakasus membuktikan kekeliruan itu.",
          ],
        },
      },
      ending_001_blackbox_meta: {
        title: "Model Analis",
        body: { sections: ["MODEL ANALIS: MENOLAK PENUTUPAN YANG DISARANKAN"] },
      },
    },
    puzzle: {
      puzzle_001_ferry_authenticity: {
        title: "Perbandingan tanda tangan peristiwa feri",
        referenceLabel: "Peristiwa feri normal",
        disputedLabel: "Peristiwa feri Maya",
        properties: {
          property_gate_device: {
            label: "Perangkat gerbang",
            referenceValue: "Terminal fisik",
            disputedValue: "Layanan replikasi",
          },
          property_location_proof: {
            label: "Bukti lokasi",
            referenceValue: "Beacon dan kamera",
            disputedValue: "Beacon saja",
          },
          property_account_signature: {
            label: "Tanda tangan akun",
            referenceValue: "Token penumpang",
            disputedValue: "Token replay administratif",
          },
          property_sync_delay: {
            label: "Jeda sinkronisasi",
            referenceValue: "2–8 detik",
            disputedValue: "19 menit",
          },
        },
        conclusionText: "Keberangkatan feri itu disuntikkan lewat layanan replay administratif.",
      },
    },
    conclusion: {
      conclusion_001_missing_signal: {
        claimSlots: {
          claim_001_location: {
            prompt: "Lokasi terakhir yang terkonfirmasi",
            answerOptions: {
              claim_001_location_north_barrier: { label: "Koridor pemeliharaan North Barrier" },
              claim_001_location_ferry: { label: "Feri ke daratan utama" },
              claim_001_location_unknown: { label: "Tidak diketahui — meninggalkan kota" },
            },
          },
          claim_001_ferry_record: {
            prompt: "Catatan feri",
            answerOptions: {
              claim_001_ferry_authentic: { label: "Asli — dia benar-benar berangkat" },
              claim_001_ferry_forged: { label: "Dipalsukan lewat replay administratif" },
            },
          },
          claim_001_obstruction: {
            prompt: "Penghalang utama dari pihak manusia",
            answerOptions: {
              claim_001_obstruction_reno: { label: "Reno Adikara" },
              claim_001_obstruction_nara: { label: "Nara Santoso" },
              claim_001_obstruction_sera: { label: "Sera Wibawa" },
            },
          },
          claim_001_return_reason: {
            prompt: "Alasan Maya kembali",
            answerOptions: {
              claim_001_reason_sabotage: { label: "Untuk menyabotase Node 7" },
              claim_001_reason_evidence: { label: "Untuk menyimpan atau mengambil bukti diagnostik Node 7" },
              claim_001_reason_meeting: { label: "Untuk menemui seorang kontak" },
            },
          },
        },
        disclosureChoices: {
          disclosure_001_mio_full: { label: "Serahkan arsip diagnostik lengkap ke MIO" },
          disclosure_001_mio_redacted: { label: "Serahkan bukti penghalangan dengan lokasi Maya yang disensor" },
          disclosure_001_pelaga: { label: "Ikuti permintaan Pelaga dan klasifikasikan arsip sebagai data curian" },
          disclosure_001_open_signal: { label: "Bocorkan arsip ke Open Signal" },
        },
      },
    },
    search: {
      rec_001_ferry_departure: {
        title: "Catatan Keberangkatan Feri",
        exactTerms: ["feri", "keberangkatan", "keberangkatan feri"],
        aliases: ["catatan feri", "catatan transit"],
      },
      rec_001_emergency_call: {
        title: "Panggilan Darurat North Barrier",
        exactTerms: ["darurat", "panggilan darurat"],
        aliases: ["metadata panggilan darurat", "panggilan north barrier"],
      },
      rec_001_maya_profile: {
        title: "Maya Pranata — Profil Karyawan",
        exactTerms: ["profil karyawan"],
        aliases: ["profil maya", "catatan karyawan"],
      },
      rec_001_sera_field_note: {
        title: "Catatan Lapangan CIAB — Sera Wibawa",
        exactTerms: ["catatan lapangan"],
        aliases: ["catatan sera", "catatan lapangan ciab"],
      },
      char_maya_pranata: {
        title: "Maya Pranata",
        aliases: ["insinyur pelaga"],
      },
      char_sera_wibawa: {
        title: "Sera Wibawa",
        aliases: ["penyidik ciab"],
      },
      rec_001_ferry_baseline: {
        title: "Baseline Gerbang Feri — Peristiwa Keberangkatan Normal",
        exactTerms: ["baseline", "keberangkatan normal"],
        aliases: ["peristiwa feri normal", "baseline gerbang"],
      },
      rec_001_node7_summary: {
        title: "Ringkasan Pemeliharaan Node 7",
        exactTerms: ["pemeliharaan"],
        aliases: ["pengendalian banjir"],
      },
      rec_001_manual_escalation: {
        title: "Eskalasi Manual — Pembungkaman Peringatan Node 7",
        exactTerms: ["eskalasi", "eskalasi manual"],
        aliases: ["tiket eskalasi"],
      },
      rec_001_corridor_access: {
        title: "Log Akses Koridor North Barrier",
        exactTerms: ["koridor", "log akses"],
        aliases: ["akses koridor"],
      },
      rec_001_reliability_report: {
        title: "Laporan Keandalan Publik Pelaga — November",
        exactTerms: ["keandalan", "laporan"],
        aliases: ["laporan publik"],
      },
      rec_001_checksum_record: {
        title: "Catatan Checksum Teranonimkan",
        exactTerms: ["bukti"],
        aliases: ["catatan checksum", "catatan verifikasi"],
      },
    },
  },
};
