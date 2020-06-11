var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForPatientView = require('../../../shared/specUtils')
    .waitForPatientView;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const patientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=teststudy_genepanels&caseId=patientA';
const ascnPatientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=ascn_test_study&caseId=p_C_1T16WJ';

describe('patient view page', function() {
    describe('ascn column icons', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(ascnPatientViewUrl);
            waitForPatientView();
        });

        it.only('shows ccf bar chart', () => {
            const geneCell = $(
                'div[data-test=patientview-mutation-table] table'
            ).$('span=PIK3R1');
            const ccfCell = geneCell
                .$('..')
                .$('..')
                .$('span[data-test=ccf-cell]');
            var res = browser.checkElement(ccfCell);
            assertScreenShotMatch(ccfCell);
        });
    });

    describe('gene panel icons', () => {
        const iconIndexGenePanelSample = 2;
        const iconIndexWholeGenomeSample = 3;

        beforeEach(() => {
            goToUrlAndSetLocalStorage(patientViewUrl);
            waitForPatientView();
        });

        it('shows gene panel icons behind mutation and CNA genomic tracks', () => {
            var res = browser.checkElement(
                'div.genomicOverviewTracksContainer'
            );
            assertScreenShotMatch(res);
        });

        it('filters mutation tracks based on gene filter setting', () => {
            switchGeneFilter('allSamples');
            var res = browser.checkElement(
                'div.genomicOverviewTracksContainer'
            );
            assertScreenShotMatch(res);
        });

        it('filters VAF plot based on gene filter setting when switching to "all samples"', () => {
            switchGeneFilter('allSamples');
            doVafPlotScreenshotTest();
        });

        it('filters VAF plot based on gene filter setting when switching to "any sample"', () => {
            switchGeneFilter('anySample');
            doVafPlotScreenshotTest();
        });
    });
});

const switchGeneFilter = selectedOption => {
    var filterIcon = $('div[data-test=patientview-mutation-table]').$(
        'i[data-test=gene-filter-icon]'
    );
    filterIcon.click();
    var selectMenu = $('.rc-tooltip');
    const allGenesRadio = selectMenu.$('input[value=' + selectedOption + ']');
    allGenesRadio.click();
    filterIcon.click();
};

const doVafPlotScreenshotTest = () => {
    var res = browser.checkElement('[data-test=vaf-plot]'); // grabs the full plot
    browser.moveToObject('svg[data-test=vaf-plot]'); // moves pointer to plot thumbnail
    var res = browser.checkElement('div[role=tooltip] [data-test=vaf-plot]'); // grabs the full plot
    $('div[role=tooltip] [data-test=vaf-plot]').waitForExist();
    res = browser.checkElement('div[role=tooltip] [data-test=vaf-plot]'); // grabs the full plot
    assertScreenShotMatch(res);
};
