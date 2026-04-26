// ---------------------------------------------------------------------------
// CertificatePDF — React PDF component using @react-pdf/renderer
// Server-side only — do NOT add "use client" directive
// ---------------------------------------------------------------------------

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  recipientName: string
  issuedAt: string        // e.g. "April 18, 2026"
  score: number           // percentage e.g. 95
  certificateCode: string
  signatory: string       // e.g. "Dr. Tilis"
  logoUrl: string         // absolute URL to logo-horizontal.png
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const PRIMARY = "#1E3A5F"
const ACCENT  = "#F97316"
const GOLD    = "#D4A017"
const LIGHT   = "#F5F5F0"

const s = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
    padding: 0,
  },
  // Outer border frame
  outerFrame: {
    margin: 14,
    borderWidth: 7,
    borderColor: PRIMARY,
    borderStyle: "solid",
    flex: 1,
    flexDirection: "column",
  },
  // Inner border frame
  innerFrame: {
    margin: 6,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderStyle: "solid",
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingVertical: 20,
    backgroundColor: LIGHT,
  },
  // Logo image
  logoImage: {
    width: 200,
    height: 50,
    alignSelf: "center",
    objectFit: "contain",
  },
  subtitleText: {
    fontSize: 9,
    color: PRIMARY,
    textAlign: "center",
    marginTop: 3,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: PRIMARY,
    width: "60%",
    marginVertical: 10,
    alignSelf: "center",
    opacity: 0.4,
  },
  certifiesText: {
    fontSize: 11,
    color: "#555555",
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
    marginTop: 6,
  },
  recipientName: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    textAlign: "center",
    marginVertical: 6,
    letterSpacing: 1,
  },
  bodyText: {
    fontSize: 10,
    color: "#444444",
    textAlign: "center",
    lineHeight: 1.5,
    marginTop: 2,
  },
  curriculumText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY,
    textAlign: "center",
    marginTop: 3,
  },
  designationText: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY,
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 10,
  },
  metaItem: {
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 7,
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 9,
    color: PRIMARY,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  codeValue: {
    fontSize: 8,
    fontFamily: "Courier",
    color: "#555555",
    marginTop: 2,
  },
  sigBlock: {
    alignItems: "center",
    marginTop: 10,
  },
  sigLine: {
    height: 0.5,
    backgroundColor: PRIMARY,
    width: 140,
    marginBottom: 4,
    opacity: 0.6,
  },
  sigName: {
    fontSize: 13,
    fontFamily: "Helvetica-Oblique",
    color: PRIMARY,
    textAlign: "center",
  },
  sigTitle: {
    fontSize: 8,
    color: "#666666",
    textAlign: "center",
    marginTop: 2,
  },
  footer: {
    fontSize: 8,
    color: "#AAAAAA",
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 1,
  },
})

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CertificatePDF({
  recipientName,
  issuedAt,
  score,
  certificateCode,
  signatory,
  logoUrl,
}: Props) {
  return (
    <Document
      title="Certified Ultimate Influencer™"
      author="The Ultimate Influencer™"
      subject="Black Belt Certification"
    >
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.outerFrame}>
          <View style={s.innerFrame}>
            {/* Logo */}
            <Image src={logoUrl} style={s.logoImage} />
            <Text style={s.subtitleText}>Premium Preventive Parenting Platform</Text>

            <View style={s.divider} />

            {/* Certification body */}
            <Text style={s.certifiesText}>This certifies that</Text>
            <Text style={s.recipientName}>{recipientName}</Text>
            <Text style={s.bodyText}>has successfully demonstrated mastery of</Text>
            <Text style={s.curriculumText}>The Ultimate Influencer™ Curriculum</Text>
            <Text style={s.bodyText}>and is hereby awarded the designation of</Text>
            <Text style={s.designationText}>Certified Ultimate Influencer™</Text>

            <View style={s.divider} />

            {/* Details row */}
            <View style={s.metaRow}>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Date Issued</Text>
                <Text style={s.metaValue}>{issuedAt}</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Score Achieved</Text>
                <Text style={s.metaValue}>{Math.round(score)}%</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Certificate ID</Text>
                <Text style={s.codeValue}>#{certificateCode.slice(0, 12).toUpperCase()}</Text>
              </View>
            </View>

            <View style={s.divider} />

            {/* Signature */}
            <View style={s.sigBlock}>
              <View style={s.sigLine} />
              <Text style={s.sigName}>{signatory}</Text>
              <Text style={s.sigTitle}>Child Development Expert & Founder</Text>
            </View>

            {/* Footer wordmark */}
            <Text style={s.footer}>THE ULTIMATE INFLUENCER™ · CERTIFIED</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
