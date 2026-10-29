/**
 * 개인정보 처리방침 본문. 사용자가 승인한 `docs/legal/privacy-policy-draft.md`를 글자 그대로 옮긴 구조화 데이터다.
 * 문구를 바꿀 때는 원본 문서를 먼저 고치고 사용자 승인을 받은 뒤 이 파일을 맞춘다.
 */

/** 문단 안의 한 조각. 문자열은 일반 글, 객체는 링크. */
export type PolicyInline = string | { text: string; href: string };

/** 목록 항목. 하위 목록은 children. */
export interface PolicyListItem {
  content: PolicyInline[];
  children?: PolicyListItem[];
}

/** 본문 블록: 문단, 번호 목록, 글머리 목록. */
export type PolicyBlock =
  | { type: "p"; content: PolicyInline[] }
  | { type: "ol" | "ul"; items: PolicyListItem[] };

export interface PolicySection {
  heading: string;
  blocks: PolicyBlock[];
}

export interface PrivacyPolicy {
  title: string;
  intro: PolicyBlock[];
  sections: PolicySection[];
}

/** 개인정보 처리방침 전문. */
export const PRIVACY_POLICY: PrivacyPolicy = {
  "title": "개인정보 처리방침",
  "intro": [
    {
      "type": "p",
      "content": [
        "모여공부(이하 \"서비스\")는 이용자의 개인정보를 보호하고 개인정보와 관련한 고충을 원활하게 처리하기 위하여 ",
        {
          "text": "「개인정보 보호법」 제30조",
          "href": "https://www.law.go.kr/법령/개인정보보호법/제30조"
        },
        "와 ",
        {
          "text": "같은 법 시행령 제31조",
          "href": "https://www.law.go.kr/법령/개인정보보호법시행령/제31조"
        },
        "에 따라 다음과 같이 개인정보 처리방침을 수립하여 공개합니다."
      ]
    }
  ],
  "sections": [
    {
      "heading": "제1조 (개인정보의 처리 목적)",
      "blocks": [
        {
          "type": "p",
          "content": [
            "서비스는 다음의 목적으로 개인정보를 처리합니다."
          ]
        },
        {
          "type": "ol",
          "items": [
            {
              "content": [
                "회원 식별과 Google 계정을 통한 로그인"
              ]
            },
            {
              "content": [
                "서비스 내 화면 이름 표시"
              ]
            },
            {
              "content": [
                "친구 코드를 이용한 친구 찾기"
              ]
            },
            {
              "content": [
                "접속 기록을 활용한 부정 이용 방지와 서비스 안정성 확보"
              ]
            }
          ]
        }
      ]
    },
    {
      "heading": "제2조 (처리하는 개인정보의 항목)",
      "blocks": [
        {
          "type": "p",
          "content": [
            "서비스는 Google 계정 로그인만 제공하며, 비회원 이용은 제공하지 않습니다. 서비스 이용 과정에서 처리하는 개인정보는 다음과 같습니다."
          ]
        },
        {
          "type": "ol",
          "items": [
            {
              "content": [
                "이용자가 직접 입력하는 정보: 화면 이름(1~12자)"
              ]
            },
            {
              "content": [
                "Google 로그인으로 제공받는 정보: 이메일 주소, Google 계정의 이름, 프로필 사진 주소"
              ]
            },
            {
              "content": [
                "서비스가 생성하는 정보: 계정 고유 식별자, 친구 코드(8자리, 변경 불가)"
              ]
            },
            {
              "content": [
                "서비스 이용 과정에서 자동으로 생성되어 수집되는 정보: 접속 IP 주소, 접속 일시와 접속 기록. 해당 정보는 인증 서비스와 호스팅 서비스의 운영 로그에 기록됩니다."
              ]
            }
          ]
        },
        {
          "type": "p",
          "content": [
            "Google 로그인으로 제공받는 정보 중 이메일 주소만 계정 식별에 사용합니다. Google 계정의 이름과 프로필 사진 주소는 인증 서비스가 계정 정보에 자동 저장하며, 서비스 화면에는 표시하지 않습니다."
          ]
        },
        {
          "type": "p",
          "content": [
            "서비스는 마케팅 정보 수신 동의를 받지 않습니다."
          ]
        }
      ]
    },
    {
      "heading": "제3조 (개인정보의 처리 및 보유 기간)",
      "blocks": [
        {
          "type": "p",
          "content": [
            "서비스는 계정과 프로필 정보를 회원 탈퇴(계정 삭제) 시까지 처리하고 보유하며, 탈퇴 시 지체 없이 파기합니다."
          ]
        },
        {
          "type": "p",
          "content": [
            "접속 IP 주소와 접속 일시를 포함한 접속 기록은 인증 서비스와 호스팅 서비스를 제공하는 수탁업체의 운영 정책에 따른 기간 동안 보관한 후 삭제합니다."
          ]
        },
        {
          "type": "p",
          "content": [
            "서비스가 처리하는 개인정보 중 법령에 따라 별도로 보존하는 항목은 없습니다. 수탁업체별 보유 기간은 제8조에서 안내합니다."
          ]
        }
      ]
    },
    {
      "heading": "제4조 (만 14세 미만 아동의 개인정보 처리)",
      "blocks": [
        {
          "type": "p",
          "content": [
            "서비스는 만 14세 미만 아동의 회원 가입을 허용하지 않습니다. 만 14세 미만 아동의 계정으로 확인되는 경우 해당 계정을 삭제합니다."
          ]
        },
        {
          "type": "p",
          "content": [
            "서비스는 만 14세 미만 아동의 가입을 위한 법정대리인 동의 절차를 운영하지 않습니다."
          ]
        }
      ]
    },
    {
      "heading": "제5조 (개인정보의 파기 절차 및 방법)",
      "blocks": [
        {
          "type": "p",
          "content": [
            "서비스는 다음의 절차와 방법으로 개인정보를 파기합니다."
          ]
        },
        {
          "type": "ol",
          "items": [
            {
              "content": [
                "파기 절차: 회원 탈퇴 시 계정과 프로필 정보를 지체 없이 파기합니다. 접속 IP 주소와 접속 기록은 제3조에 따른 보관 기간이 경과하면 삭제합니다."
              ]
            },
            {
              "content": [
                "파기 방법: 개인정보는 전자 파일 형태로만 보관하며, 복구할 수 없는 방법으로 삭제합니다. 종이 문서 형태의 개인정보는 보관하지 않습니다."
              ]
            }
          ]
        }
      ]
    },
    {
      "heading": "제6조 (개인정보의 제3자 제공)",
      "blocks": [
        {
          "type": "p",
          "content": [
            "서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 광고나 판매를 위한 개인정보 제공도 하지 않습니다."
          ]
        },
        {
          "type": "p",
          "content": [
            "서비스 제공을 위한 개인정보 처리업무의 위탁과 국외 이전은 제7조와 제8조에서 안내합니다."
          ]
        }
      ]
    },
    {
      "heading": "제7조 (개인정보 처리업무의 위탁)",
      "blocks": [
        {
          "type": "p",
          "content": [
            "서비스는 다음과 같이 개인정보 처리업무를 위탁합니다."
          ]
        },
        {
          "type": "ul",
          "items": [
            {
              "content": [
                "수탁자: Supabase Pte. Ltd. (싱가포르)"
              ],
              "children": [
                {
                  "content": [
                    "위탁 업무: 회원 인증과 데이터베이스 운영"
                  ]
                }
              ]
            },
            {
              "content": [
                "수탁자: Vercel Inc. (미국)"
              ],
              "children": [
                {
                  "content": [
                    "위탁 업무: 웹 호스팅"
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "p",
          "content": [
            "Google 계정 로그인 인증 제공업체는 다음과 같습니다."
          ]
        },
        {
          "type": "ul",
          "items": [
            {
              "content": [
                "인증 제공업체: Google LLC (미국)"
              ],
              "children": [
                {
                  "content": [
                    "제공 업무: Google 계정 로그인 인증"
                  ]
                },
                {
                  "content": [
                    "개인정보 처리 관계: 이용자가 Google 로그인 과정에서 Google에 직접 정보를 제공합니다. 서비스가 Google로 이전하는 개인정보는 없습니다."
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "heading": "제8조 (개인정보의 국외 이전)",
      "blocks": [
        {
          "type": "p",
          "content": [
            "서비스는 이용자와의 계약 체결 및 이행을 위한 개인정보 처리위탁과 보관을 위하여 ",
            {
              "text": "「개인정보 보호법」 제28조의8제1항제3호가목",
              "href": "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029331957"
            },
            "에 따라 다음의 국외 이전 사항을 공개합니다."
          ]
        },
        {
          "type": "ul",
          "items": [
            {
              "content": [
                "이전받는 자: Supabase Pte. Ltd. (싱가포르)"
              ],
              "children": [
                {
                  "content": [
                    "연락처: privacy@supabase.com (",
                    {
                      "text": "수탁사 개인정보 처리방침",
                      "href": "https://supabase.com/privacy"
                    },
                    ")"
                  ]
                },
                {
                  "content": [
                    "이전 항목: 이메일 주소, Google 계정의 이름, 프로필 사진 주소, 화면 이름, 계정 고유 식별자, 친구 코드, 접속 IP 주소, 접속 일시와 접속 기록"
                  ]
                },
                {
                  "content": [
                    "이전 국가와 저장 위치: 대한민국 저장, 싱가포르 법인 처리. 데이터는 대한민국 서울의 AWS ap-northeast-2 지역에 저장되며, 수탁사와 그 하위 수탁사의 관리를 위한 국외에서의 접근 가능성이 있습니다."
                  ]
                },
                {
                  "content": [
                    "이전 시기와 방법: 서비스 이용 시 네트워크를 통해 전송"
                  ]
                },
                {
                  "content": [
                    "이용 목적: 회원 인증과 데이터베이스 운영"
                  ]
                },
                {
                  "content": [
                    "보유 기간: 회원 탈퇴 시 또는 위탁 계약 종료 시까지. 다만, 운영 로그에 포함된 접속 IP 주소와 접속 기록은 수탁사의 운영 정책에 따른 기간 동안 보관한 후 삭제합니다."
                  ]
                }
              ]
            },
            {
              "content": [
                "이전받는 자: Vercel Inc."
              ],
              "children": [
                {
                  "content": [
                    "연락처: privacy@vercel.com (",
                    {
                      "text": "수탁사 개인정보 처리방침",
                      "href": "https://vercel.com/legal/privacy-notice"
                    },
                    ")"
                  ]
                },
                {
                  "content": [
                    "이전 항목: 접속 IP 주소, 접속 일시와 접속 기록"
                  ]
                },
                {
                  "content": [
                    "이전 국가: 미국 및 Vercel이 운영하는 전 세계 서버 지역"
                  ]
                },
                {
                  "content": [
                    "이전 시기와 방법: 서비스 접속 시 네트워크를 통해 전송"
                  ]
                },
                {
                  "content": [
                    "이용 목적: 웹 호스팅"
                  ]
                },
                {
                  "content": [
                    "보유 기간: 수탁사의 운영 정책에 따릅니다."
                  ]
                }
              ]
            },
            {
              "content": [
                "로그인 인증 제공업체: Google LLC (미국)"
              ],
              "children": [
                {
                  "content": [
                    "이용자가 Google 로그인 과정에서 Google에 직접 정보를 제공하며, 서비스가 Google로 이전하는 개인정보는 없습니다."
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "p",
          "content": [
            "이용자는 회원 가입을 하지 않거나 서비스 설정에서 계정을 삭제하는 방법으로 국외 이전을 거부할 수 있습니다. 해당 개인정보 처리는 서비스의 인증과 저장에 필수적이므로 국외 이전을 거부하는 경우 서비스를 이용할 수 없습니다."
          ]
        }
      ]
    },
    {
      "heading": "제9조 (개인정보의 안전성 확보 조치)",
      "blocks": [
        {
          "type": "p",
          "content": [
            "서비스는 개인정보의 안전성 확보를 위하여 다음의 조치를 적용합니다."
          ]
        },
        {
          "type": "ol",
          "items": [
            {
              "content": [
                "모든 통신에 HTTPS 암호화를 적용합니다."
              ]
            },
            {
              "content": [
                "데이터베이스에 행 단위 접근 제한을 적용하여 이용자가 본인의 데이터만 수정할 수 있도록 통제합니다."
              ]
            },
            {
              "content": [
                "관리자 접근 권한을 최소화합니다."
              ]
            },
            {
              "content": [
                "비밀 키를 분리하여 보관합니다."
              ]
            }
          ]
        }
      ]
    },
    {
      "heading": "제10조 (개인정보를 자동으로 수집하는 장치의 설치, 운영 및 거부)",
      "blocks": [
        {
          "type": "p",
          "content": [
            "서비스는 광고 또는 행태 분석을 위한 쿠키를 사용하지 않습니다."
          ]
        },
        {
          "type": "p",
          "content": [
            "서비스는 로그인 상태를 유지하기 위하여 이용자의 브라우저 저장소인 로컬 스토리지에 인증 정보를 저장합니다. 이용자는 로그아웃하거나 브라우저 설정에서 해당 사이트의 데이터를 삭제하는 방법으로 저장된 인증 정보를 삭제할 수 있습니다."
          ]
        },
        {
          "type": "p",
          "content": [
            "로컬 스토리지에 인증 정보를 저장하는 것을 거부하는 경우 로그인 상태를 유지할 수 없습니다."
          ]
        }
      ]
    },
    {
      "heading": "제11조 (정보주체의 권리, 의무 및 행사 방법)",
      "blocks": [
        {
          "type": "p",
          "content": [
            "이용자는 서비스에 대하여 자신의 개인정보에 대한 열람, 정정, 삭제 및 처리정지를 요구할 수 있습니다."
          ]
        },
        {
          "type": "ol",
          "items": [
            {
              "content": [
                "화면 이름의 정정: 서비스 설정에서 직접 수정할 수 있습니다."
              ]
            },
            {
              "content": [
                "계정 삭제: 서비스 설정에서 직접 계정을 삭제할 수 있습니다."
              ]
            },
            {
              "content": [
                "그 밖의 권리 행사: 제12조에 기재된 개인정보 보호책임자 이메일로 요구할 수 있습니다."
              ]
            },
            {
              "content": [
                "대리인을 통한 권리 행사: 이용자의 위임을 받은 대리인을 통하여 권리를 행사할 수 있습니다."
              ]
            }
          ]
        },
        {
          "type": "p",
          "content": [
            "서비스는 관계 법령에 따라 권리 행사 요구를 처리합니다. 이용자는 타인의 개인정보와 권리를 침해하지 않아야 합니다."
          ]
        }
      ]
    },
    {
      "heading": "제12조 (개인정보 보호책임자)",
      "blocks": [
        {
          "type": "p",
          "content": [
            "서비스의 개인정보 보호책임자와 개인정보 관련 문의, 불만 처리 및 권리 행사 접수 창구는 다음과 같습니다."
          ]
        },
        {
          "type": "ul",
          "items": [
            {
              "content": [
                "직책: 모여공부 운영자"
              ]
            },
            {
              "content": [
                "이메일: ksa1800066@gmail.com"
              ]
            }
          ]
        }
      ]
    },
    {
      "heading": "제13조 (권익침해 구제 방법)",
      "blocks": [
        {
          "type": "p",
          "content": [
            "이용자는 개인정보 침해에 대한 상담, 신고 또는 분쟁조정을 위하여 다음 기관에 문의할 수 있습니다."
          ]
        },
        {
          "type": "ul",
          "items": [
            {
              "content": [
                "개인정보 분쟁조정위원회: 1833-6972, ",
                {
                  "text": "www.kopico.go.kr",
                  "href": "https://www.kopico.go.kr"
                }
              ]
            },
            {
              "content": [
                "개인정보침해신고센터: 118, ",
                {
                  "text": "privacy.kisa.or.kr",
                  "href": "https://privacy.kisa.or.kr"
                }
              ]
            },
            {
              "content": [
                "대검찰청: 1301, ",
                {
                  "text": "www.spo.go.kr",
                  "href": "https://www.spo.go.kr"
                }
              ]
            },
            {
              "content": [
                "경찰청: 182, ",
                {
                  "text": "ecrm.police.go.kr",
                  "href": "https://ecrm.police.go.kr"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "heading": "제14조 (개인정보 처리방침의 변경)",
      "blocks": [
        {
          "type": "p",
          "content": [
            "이 개인정보 처리방침은 2026년 10월 29일부터 시행합니다."
          ]
        },
        {
          "type": "p",
          "content": [
            "개인정보 처리방침이 변경되는 경우 변경 사항과 시행일을 시행 7일 전부터 서비스 내에 공지합니다."
          ]
        }
      ]
    }
  ]
};
