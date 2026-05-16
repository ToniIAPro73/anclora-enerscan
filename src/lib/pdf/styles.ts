import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#F6F2EA',
  },
  header: {
    marginBottom: 24,
    borderBottom: '2 solid #008F5A',
    paddingBottom: 10,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 6,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    color: '#171512',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#645D53',
    marginTop: 5,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#008F5A',
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1 solid #D8CEC0',
    paddingBottom: 5,
  },
  text: {
    fontSize: 10,
    color: '#2B2721',
    lineHeight: 1.5,
    marginBottom: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  annexRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottom: '1 solid #E7DED1',
  },
  colLeft: {
    width: '40%',
    fontSize: 10,
    color: '#645D53',
  },
  colRight: {
    width: '60%',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#171512',
  },
  scoreBox: {
    backgroundColor: '#EFE8DD',
    border: '1 solid #D8CEC0',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  letter: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#008F5A',
  },
  disclaimer: {
    marginTop: 18,
    padding: 10,
    backgroundColor: '#F4E7C2',
    fontSize: 8,
    color: '#6F4A00',
    fontStyle: 'italic',
  },
  scenarioBox: {
    border: '1 solid #D8CEC0',
    padding: 11,
    marginBottom: 10,
    borderRadius: 4,
    backgroundColor: '#FFFDF8',
  },
  scenarioTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#171512',
    marginBottom: 5,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bulletPoint: {
    width: 10,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
  },
  annexMetaBox: {
    border: '1 solid #D8CEC0',
    backgroundColor: '#FFFDF8',
    padding: 10,
    borderRadius: 4,
  },
  documentFrame: {
    minHeight: 420,
    border: '1 solid #D8CEC0',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#FFFDF8',
  },
  attachmentImage: {
    maxWidth: '100%',
    maxHeight: 500,
    objectFit: 'contain',
  },
  imageAnnexGrid: {
    gap: 18,
  },
  imageAnnexCard: {
    height: 235,
    border: '1 solid #D8CEC0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#FFFDF8',
  },
  imageAnnexCardSingle: {
    marginTop: 110,
  },
  imageCaption: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#171512',
    marginBottom: 8,
  },
  annexImage: {
    width: '100%',
    height: 166,
    objectFit: 'contain',
    borderRadius: 4,
  },
  ceePageFrame: {
    border: '1 solid #e0e0e0',
    borderRadius: 4,
    padding: 6,
    backgroundColor: '#ffffff',
  },
  ceePageImage: {
    width: '100%',
    height: 610,
    objectFit: 'contain',
  },
  ceeFullPage: {
    padding: 0,
    margin: 0,
    backgroundColor: '#ffffff',
  },
  ceeFullPageImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  imageMeta: {
    marginTop: 7,
    fontSize: 8,
    color: '#645D53',
  },
  preText: {
    fontSize: 9,
    color: '#2B2721',
    lineHeight: 1.35,
  }
});
