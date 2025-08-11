    {
      "name": "page_health_complaints",
      "title": "Health Complaints",
      "elements": [
        {
          "type": "panel",
          "name": "major_complaints_panel",
          "title": "Major Complaints"
        },
        {
          "type": "panel",
          "name": "panel1",
          "title": "Visual Analog Scale & Pain Assessment",
          "description": "Comprehensive pain assessment with intensity and frequency measurements",
          "elements": [
            {
              "type": "panel",
              "name": "panel2",
              "title": "Section 1 - Pain Intensity",
              "description": "For each area below, please describe your present pain level (0 = no pain, 10 = worst pain imaginable) and indicate pain frequency.",
              "elements": [
                {
                  "type": "html",
                  "name": "question1",
                  "html": "<div style=\"display: grid; grid-template-columns: 1fr 1fr; font-weight: bold; text-align: center; margin-bottom: 10px;\"><div>Pain Intensity</div><div>Pain Frequency</div></div>"
                },
                {
                  "type": "panel",
                  "name": "panel3",
                  "title": "Neck",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question2",
                      "title": "Do you have neck pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel4",
                      "visibleIf": "{question2} = \"Yes\"",
                      "elements": [
                        {
                          "type": "slider",
                          "name": "question3",
                          "title": "Pain Severity (0-10)",
                          "max": 10
                        },
                        {
                          "type": "radiogroup",
                          "name": "question4",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel5",
                  "title": "Headaches",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question5",
                      "title": "Do you have headaches?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel6",
                      "visibleIf": "{question5} = \"Yes\"",
                      "elements": [
                        {
                          "type": "slider",
                          "name": "question6",
                          "title": "Pain Severity (0-10)",
                          "max": 10
                        },
                        {
                          "type": "radiogroup",
                          "name": "question7",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel7",
                  "title": "Low Back",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question8",
                      "title": "Do you have low back pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel8",
                      "visibleIf": "{question8} = \"Yes\"",
                      "elements": [
                        {
                          "type": "slider",
                          "name": "question9",
                          "title": "Pain Severity (0-10)",
                          "max": 10
                        },
                        {
                          "type": "radiogroup",
                          "name": "question10",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel9",
                  "title": "Mid Back",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question11",
                      "title": "Do you have mid back pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel10",
                      "visibleIf": "{question11} = \"Yes\"",
                      "elements": [
                        {
                          "type": "slider",
                          "name": "question12",
                          "title": "Pain Severity (0-10)",
                          "max": 10
                        },
                        {
                          "type": "radiogroup",
                          "name": "question13",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel11",
                  "title": "Upper Back",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question14",
                      "title": "Do you have upper back pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel12",
                      "visibleIf": "{question14} = \"Yes\"",
                      "elements": [
                        {
                          "type": "slider",
                          "name": "question15",
                          "title": "Pain Severity (0-10)",
                          "max": 10
                        },
                        {
                          "type": "radiogroup",
                          "name": "question16",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel13",
                  "title": "Shoulder(s)",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question17",
                      "title": "Do you have shoulder pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel14",
                      "visibleIf": "{question17} = \"Yes\"",
                      "elements": [
                        {
                          "type": "checkbox",
                          "name": "question18",
                          "title": "Which side(s)?",
                          "choices": [
                            "Left",
                            "Right"
                          ]
                        },
                        {
                          "type": "slider",
                          "name": "question19",
                          "title": "Pain Severity (0-10)",
                          "max": 10
                        },
                        {
                          "type": "radiogroup",
                          "name": "question20",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel15",
                  "title": "Hip(s)",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question21",
                      "title": "Do you have hip pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel16",
                      "visibleIf": "{question21} = \"Yes\"",
                      "elements": [
                        {
                          "type": "checkbox",
                          "name": "question22",
                          "title": "Which side(s)?",
                          "choices": [
                            "Left",
                            "Right"
                          ]
                        },
                        {
                          "type": "slider",
                          "name": "question23",
                          "title": "Pain Severity (0-10)",
                          "max": 10
                        },
                        {
                          "type": "radiogroup",
                          "name": "question24",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel17",
                  "title": "Arm(s)",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question25",
                      "title": "Do you have arm pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel18",
                      "visibleIf": "{question25} = \"Yes\"",
                      "elements": [
                        {
                          "type": "checkbox",
                          "name": "question26",
                          "title": "Which side(s)?",
                          "choices": [
                            "Left",
                            "Right"
                          ]
                        },
                        {
                          "type": "slider",
                          "name": "question27",
                          "title": "Pain Severity (0-10)",
                          "max": 10
                        },
                        {
                          "type": "radiogroup",
                          "name": "question28",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel19",
                  "title": "Leg(s)",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question29",
                      "title": "Do you have leg pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel20",
                      "visibleIf": "{question29} = \"Yes\"",
                      "elements": [
                        {
                          "type": "checkbox",
                          "name": "question30",
                          "title": "Which side(s)?",
                          "choices": [
                            "Left",
                            "Right"
                          ]
                        },
                        {
                          "type": "slider",
                          "name": "question31",
                          "title": "Pain Severity (0-10)",
                          "max": 10
                        },
                        {
                          "type": "radiogroup",
                          "name": "question32",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel21",
                  "title": "Other Area",
                  "elements": [
                    {
                      "type": "text",
                      "name": "question33",
                      "title": "Please specify other pain area (if applicable):"
                    },
                    {
                      "type": "panel",
                      "name": "panel22",
                      "visibleIf": "{question33} notempty",
                      "elements": [
                        {
                          "type": "checkbox",
                          "name": "question34",
                          "title": "Side (if applicable):",
                          "choices": [
                            "Left",
                            "Right",
                            "Central"
                          ]
                        },
                        {
                          "type": "slider",
                          "name": "question35",
                          "title": "Pain Severity (0-10)",
                          "max": 10
                        },
                        {