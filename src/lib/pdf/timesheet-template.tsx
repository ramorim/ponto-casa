import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#666",
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingBottom: 8,
    borderBottom: "1 solid #ddd",
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8,
    color: "#999",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottom: "1 solid #ddd",
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5 solid #eee",
    paddingVertical: 4,
  },
  tableRowWeekend: {
    flexDirection: "row",
    borderBottom: "0.5 solid #eee",
    paddingVertical: 4,
    backgroundColor: "#f9fafb",
  },
  colDate: { width: "18%", paddingLeft: 4 },
  colTime: { width: "14%", textAlign: "center" },
  colTotal: { width: "12%", textAlign: "right", paddingRight: 4 },
  headerText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
  },
  cellText: {
    fontSize: 9,
  },
  cellTextMuted: {
    fontSize: 9,
    color: "#9ca3af",
  },
  summaryGrid: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    border: "0.5 solid #e5e7eb",
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 7,
    color: "#6b7280",
  },
  acceptance: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
    border: "0.5 solid #bbf7d0",
  },
  acceptanceText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#166534",
    marginBottom: 4,
  },
  acceptanceDetail: {
    fontSize: 8,
    color: "#15803d",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: "#9ca3af",
    borderTop: "0.5 solid #e5e7eb",
    paddingTop: 8,
  },
});

interface DayData {
  date: string;
  dayLabel: string;
  isWeekend: boolean;
  entrada: string | null;
  saida_almoco: string | null;
  volta_almoco: string | null;
  saida: string | null;
  total: string | null;
}

interface TimesheetData {
  monthLabel: string;
  employeeName: string;
  employerName: string;
  days: DayData[];
  totalHours: number | null;
  overtimeHours: number | null;
  delayMinutes: number | null;
  absenceDays: number | null;
  accepted: boolean;
  acceptedAt: string | null;
  generatedAt: string;
}

export function TimesheetDocument({ data }: { data: TimesheetData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Espelho de Ponto</Text>
          <Text style={styles.subtitle}>Ponto Casa</Text>
        </View>

        {/* Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>FUNCIONÁRIO(A)</Text>
            <Text style={styles.infoValue}>{data.employeeName}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>EMPREGADOR(A)</Text>
            <Text style={styles.infoValue}>{data.employerName}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>REFERÊNCIA</Text>
            <Text style={styles.infoValue}>{data.monthLabel}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colDate}>
              <Text style={styles.headerText}>Data</Text>
            </View>
            <View style={styles.colTime}>
              <Text style={styles.headerText}>Entrada</Text>
            </View>
            <View style={styles.colTime}>
              <Text style={styles.headerText}>Almoço</Text>
            </View>
            <View style={styles.colTime}>
              <Text style={styles.headerText}>Retorno</Text>
            </View>
            <View style={styles.colTime}>
              <Text style={styles.headerText}>Saída</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={styles.headerText}>Total</Text>
            </View>
          </View>

          {data.days.map((day) => (
            <View
              key={day.date}
              style={day.isWeekend ? styles.tableRowWeekend : styles.tableRow}
            >
              <View style={styles.colDate}>
                <Text style={day.isWeekend ? styles.cellTextMuted : styles.cellText}>
                  {day.dayLabel}
                </Text>
              </View>
              <View style={styles.colTime}>
                <Text style={styles.cellText}>{day.entrada || "—"}</Text>
              </View>
              <View style={styles.colTime}>
                <Text style={styles.cellText}>{day.saida_almoco || "—"}</Text>
              </View>
              <View style={styles.colTime}>
                <Text style={styles.cellText}>{day.volta_almoco || "—"}</Text>
              </View>
              <View style={styles.colTime}>
                <Text style={styles.cellText}>{day.saida || "—"}</Text>
              </View>
              <View style={styles.colTotal}>
                <Text style={styles.cellText}>{day.total || "—"}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {data.totalHours?.toFixed(1) ?? "—"}h
            </Text>
            <Text style={styles.summaryLabel}>Total trabalhado</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {data.overtimeHours?.toFixed(1) ?? "0"}h
            </Text>
            <Text style={styles.summaryLabel}>Horas extras</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {data.delayMinutes ?? 0}min
            </Text>
            <Text style={styles.summaryLabel}>Atrasos</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{data.absenceDays ?? 0}</Text>
            <Text style={styles.summaryLabel}>Faltas</Text>
          </View>
        </View>

        {/* Acceptance */}
        {data.accepted && (
          <View style={styles.acceptance}>
            <Text style={styles.acceptanceText}>
              ✓ Aceite digital registrado
            </Text>
            <Text style={styles.acceptanceDetail}>
              O(a) funcionário(a) confirmou que os horários acima correspondem à
              sua jornada.
              {data.acceptedAt &&
                ` Aceito em ${new Date(data.acceptedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`}
            </Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Documento gerado em {data.generatedAt} pelo Ponto Casa •
          Este documento é um espelho de ponto eletrônico para fins de
          arquivamento e conferência.
        </Text>
      </Page>
    </Document>
  );
}
