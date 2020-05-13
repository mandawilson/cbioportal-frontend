import * as _ from 'lodash';
import { ReactWrapper, mount } from 'enzyme';
import { assert } from 'chai';
import { Mutation, ClinicalData } from 'cbioportal-ts-api-client';
import { initMutation } from 'test/MutationMockUtils';
import { initClinicalData } from 'test/ClinicalDataMockUtils';
import { CAID_FACETS_WGD } from 'shared/constants';
import { getDefaultASCNCopyNumberColumnDefinition } from './ASCNCopyNumberColumnFormatter';

/* Test design
    This column formatter renders a complex element which includes a hoverover tooltip popup.
    The rendered elements in a single table cell include:
        - a number (the # of samples with the variant) of copy number icon svg elements which vary by:
            - fill-color : selected from the set {
                        ASCN_AMP = #ff0000 (red) [2]
                        ASCN_GAIN #e15b5b (a salmon-ish color close to web color 'IndianRed') [1]
                        ASCN_LIGHTGREY #bcbcbc (close to web color 'Silver') [0]
                        ASCN_HETLOSS #2a5eea (a medium blue color close to web color 'DodgerBlue') [-1]
                        ASCN_HOMDEL #0000ff (blue) [-2]
                        ASCN_BLACK #000000 (black) [anything else]
                    } based on the value of mutation attribute ASCNCopyNumberValue (e.g. [1])
            - text : showing the value of ASCNCopyNumberValue if in {'-2','-1','0','1','2'}
            - optional "WGD" suprascript, evident when the sample represented has clinical
                    attribute 'FACETS_WGD' containing a value "WGD" (and not "NO_WGD")
        - a hoverover tooltip showing one line per sample having the variant, each line with
            - a sample number icon using black SVG circle with superimposed white numeral
            - a text label (e.g. "diploid") corresponding to the ASCNCopyNumberValue
            - text indication of presence/absence of WGD clinical attribute
            - text reporting of TOTAL_COPY_NUMBER and MINOR_COPY_NUMBER mutation attribute values
            
    test cases explore various expected combinations of the above elements:
        - cases involving only a single sample:
            - without any set ASCN mutation attriubutes
            - with NO_WGD and ASCNCopyNumberValue from each of {'-2','-1','0','1','2','999','NA'}
            - with WGD and ASCNCopyNumberValue from each of {see_above}
        - cases involving two samples:
            - without any set ASCN mutation attriubutes
            - sample1 NO_WGD, ASCNCopyNumberValue from each of {see_above}; sample2 NO_WGD, ASCN_AMP
            - sample1 NO_WGD, ASCN_HOMDEL; sample2 NO_WGD, ASCNCopyNumberValue from each of {see_above}
            - sample1 NO_WGD, ASCN_HETLOSS; sample2 WGD, ASCN_GAIN
            - sample1 WGD, ASCN_HOMDEL; sample2 NO_WGD, ASCN_GAIN
            - sample1 WGD, ASCN_LIGHTGREY [0]; sample2 WGD, ASCN_BLACK [999]
        - cases involving three samples:
            - sample1 WGD, ASCN_AMP; sample2 NO_WGD, ASCN_LIGHTGREY; sample3 WGD, ASCN_HOMDEL
    
    Note: all tests will test the appropriate presence of a populated tooltip popup
    Also, the first single sample test case, and second two sample test case will omit the
    samplemanager and still expect a populated tooltip to be output. Sub elementes in the tool tip
    are not tested for correctness.
*/

function createMockMutation(sampleId: string, copyNumber?: string) {
    if (copyNumber) {
        return initMutation({
            sampleId: sampleId,
            alleleSpecificCopyNumber: {
                ascnMethod: 'mock_ascn_method',
                ascnIntegerCopyNumber: copyNumber,
                minorCopyNumber: 1,
                totalCopyNumber: 2,
            },
        });
    }
    return initMutation({
        sampleId: sampleId,
    });
}

describe('ASCNCopyNumberColumnFormatter', () => {
    /* mock sample ids */
    const sampleId1WithAscnData: string = 'sample_1_with_ascn_data';
    const sampleId2WithAscnData: string = 'sample_2_with_ascn_data';
    const sampleId3WithAscnData: string = 'sample_3_with_ascn_data';
    const sampleId6WithoutAscnData: string = 'sample_6_without_ascn_data';
    const sampleId7WithoutAscnData: string = 'sample_7_without_ascn_data';
    const sampleIds1: string[] = [sampleId1WithAscnData];
    const sampleIds12: string[] = [
        sampleId1WithAscnData,
        sampleId2WithAscnData,
    ];
    const sampleIds123: string[] = [
        sampleId1WithAscnData,
        sampleId2WithAscnData,
        sampleId3WithAscnData,
    ];
    const sampleIds6: string[] = [sampleId6WithoutAscnData];
    const sampleIds67: string[] = [
        sampleId6WithoutAscnData,
        sampleId7WithoutAscnData,
    ];
    /* mock mutation data */
    const mutationS1Amp = createMockMutation(sampleId1WithAscnData, '2');
    const mutationS1Gain = createMockMutation(sampleId1WithAscnData, '1');
    const mutationS1Diploid = createMockMutation(sampleId1WithAscnData, '0');
    const mutationS1Hetloss = createMockMutation(sampleId1WithAscnData, '-1');
    const mutationS1Homdel = createMockMutation(sampleId1WithAscnData, '-2');
    const mutationS1Other = createMockMutation(sampleId1WithAscnData, '999');
    const mutationS1NA = createMockMutation(sampleId1WithAscnData, 'NA');
    const mutationS2Amp = createMockMutation(sampleId2WithAscnData, '2');
    const mutationS2Gain = createMockMutation(sampleId2WithAscnData, '1');
    const mutationS2Diploid = createMockMutation(sampleId2WithAscnData, '0');
    const mutationS2Hetloss = createMockMutation(sampleId2WithAscnData, '-1');
    const mutationS2Homdel = createMockMutation(sampleId2WithAscnData, '-2');
    const mutationS2Other = createMockMutation(sampleId2WithAscnData, '999');
    const mutationS2NA = createMockMutation(sampleId2WithAscnData, 'NA');
    const mutationS3Amp = createMockMutation(sampleId3WithAscnData, '2');
    const mutationS3Gain = createMockMutation(sampleId3WithAscnData, '1');
    const mutationS3Diploid = createMockMutation(sampleId3WithAscnData, '0');
    const mutationS3Hetloss = createMockMutation(sampleId3WithAscnData, '-1');
    const mutationS3Homdel = createMockMutation(sampleId3WithAscnData, '-2');
    const mutationS3Other = createMockMutation(sampleId3WithAscnData, '999');
    const mutationS3NA = createMockMutation(sampleId3WithAscnData, 'NA');
    const mutationS6 = createMockMutation(sampleId6WithoutAscnData);
    const mutationS7 = createMockMutation(sampleId7WithoutAscnData);
    const mutationsS1Amp: Mutation[] = [mutationS1Amp];
    const mutationsS1Gain: Mutation[] = [mutationS1Gain];
    const mutationsS1Diploid: Mutation[] = [mutationS1Diploid];
    const mutationsS1Hetloss: Mutation[] = [mutationS1Hetloss];
    const mutationsS1Homdel: Mutation[] = [mutationS1Homdel];
    const mutationsS1Other: Mutation[] = [mutationS1Other];
    const mutationsS1NA: Mutation[] = [mutationS1NA];
    const mutationsS6: Mutation[] = [mutationS6];
    /* mock clinical attributes */
    const clinicalDataSampleIdForSample1: ClinicalData = initClinicalData({
        clinicalAttributeId: 'SAMPLE_ID',
        value: sampleId1WithAscnData,
    });
    // const clinicalDataSampleIdForSample6: ClinicalData = initClinicalData(
    //     {
    //         clinicalAttributeId: 'SAMPLE_ID',
    //         value: sampleId6WithoutAscnData,
    //     }
    // );
    const clinicalDataWgd: ClinicalData = initClinicalData({
        clinicalAttributeId: CAID_FACETS_WGD,
        value: 'WGD',
    });
    const clinicalDataNoWgd: ClinicalData = initClinicalData({
        clinicalAttributeId: CAID_FACETS_WGD,
        value: 'NO_WGD',
    });
    // const sampleIdToClinicalDataMapWithoutAscnData: {
    //     [sampleId: string]: ClinicalData[];
    // } = { sampleIdWithoutAscnData: [clinicalDataSampleIdForSampleWithoutAscnData] };
    const sampleIdToClinicalDataMapWithWgd: {
        [sampleId: string]: ClinicalData[];
    } = {
        [sampleId1WithAscnData]: [
            clinicalDataSampleIdForSample1,
            clinicalDataWgd,
        ],
    };
    const sampleIdToClinicalDataMapWithoutWgd: {
        [sampleId: string]: ClinicalData[];
    } = {
        [sampleId1WithAscnData]: [
            clinicalDataSampleIdForSample1,
            clinicalDataNoWgd,
        ],
    };
    /* mock react components */
    let componentS1DiploidWgd: ReactWrapper<any, any>;
    let componentS6: ReactWrapper<any, any>;

    before(() => {
        componentS1DiploidWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithWgd
            ).render(mutationsS1Diploid)
        );
        componentS6 = mount(
            getDefaultASCNCopyNumberColumnDefinition().render(mutationsS6)
        );
    });

    it('renders sample1 Wgd diploid', () => {
        // console.log(' samples with ascn data: ');
        componentS1DiploidWgd.find('text').forEach(el => {
            console.log(el.text());
        });
        // console.log(' samples without ascn data: ');
        // componentWithoutAscnCopyNumberColumn
        //     .find('svg')
        //     .forEach(spanElement => {
        //         console.log(spanElement.html());
        //     });

        assert.isDefined(
            componentS1DiploidWgd.find('text'),
            'ASCN copy number elements expected'
        );
        assert.equal(
            componentS1DiploidWgd.find('text').length,
            2,
            'wrong element count'
        );
        assert.equal(
            componentS1DiploidWgd
                .find('text')
                .at(0)
                .text(),
            'WGD',
            'WGD indicator wrong'
        );
        assert.equal(
            componentS1DiploidWgd
                .find('text')
                .at(1)
                .text(),
            '2',
            'copy number wrong'
        );

        let testOverlay: any = componentS1DiploidWgd
            .find('DefaultTooltip')
            .prop('overlay');
        assert.isTrue(
            testOverlay && testOverlay.props.ascnCopyNumberValue == '0',
            'something wrong here.'
        );
        // assert.isTrue(
        //     componentWithoutAscnCopyNumberColumn
        //         .find('rect')
        //         .length == 0,
        //     'ASCN copy number should be an empty string if mutation has no ASCN data available.'
        // );
    });
    after(() => {});
});
